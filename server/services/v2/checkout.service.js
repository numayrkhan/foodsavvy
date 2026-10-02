// Path sanity check: server/services/v2/checkout.service.js
const prisma = require("../../db");

/**
 * Calculates distance in miles between two coordinates using Haversine formula.
 * Earth Radius = 3958.8 miles
 */
function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class CheckoutService {
  /**
   * Computes delivery quote based on Admin DeliverySettings (id=1).
   * Throws "DELIVERY_DISABLED" if settings are missing or invalid.
   */
  async getDeliveryQuote(destination) {
    const settings = await prisma.deliverySettings.findUnique({
      where: { id: 1 }
    });

    // Check if delivery is effectively configured/enabled
    const isConfigured = 
      settings &&
      typeof settings.originLat === "number" &&
      typeof settings.originLng === "number" &&
      settings.maxRadiusMiles > 0 &&
      settings.rateCentsPerMile > 0;

    if (!isConfigured) {
      const err = new Error("Delivery is not enabled.");
      err.code = "DELIVERY_DISABLED";
      throw err;
    }

    const dist = haversineMiles(
      settings.originLat,
      settings.originLng,
      destination.lat,
      destination.lng
    );
    
    // Round distance to 2 decimal places for display consistency
    const distanceMiles = parseFloat(dist.toFixed(2));
    
    // Check range based on DB maxRadiusMiles
    const isInRange = distanceMiles <= settings.maxRadiusMiles;

    // Calculate fee: Distance * Rate (cents), rounded to nearest integer
    const deliveryFeeCents = Math.round(distanceMiles * settings.rateCentsPerMile);

    return {
      distanceMiles,
      maxMiles: settings.maxRadiusMiles,
      rateCentsPerMile: settings.rateCentsPerMile,
      deliveryFeeCents,
      isInRange
    };
  }

  /**
   * Generates a full checkout quote including item validation, grouping, and delivery fees.
   */
  async getCheckoutQuote(payload) {
    const { items, fulfillment } = payload;
    
    // 1. Fetch all referenced offerings with hierarchy
    const offeringIds = items.map(i => i.menuOfferingId);
    const offerings = await prisma.menuOffering.findMany({
      where: { id: { in: offeringIds } },
      include: {
        menu: {
          include: { serviceDay: true }
        },
        variant: {
          include: { menuItem: true }
        }
      }
    });

    const offeringMap = new Map(offerings.map(o => [o.id, o]));

    // 2. Validate items & Build Groups
    const groupMap = new Map(); // serviceDayId -> { ...groupData, items: [] }
    let subtotalCents = 0;

    // Iterate input items to preserve order and allow index-based error paths
    for (let i = 0; i < items.length; i++) {
      const inputItem = items[i];
      const offering = offeringMap.get(inputItem.menuOfferingId);

      // Validation Checks
      if (!offering) {
        const err = new Error("Offering not found");
        err.code = "OFFERING_NOT_FOUND";
        err.path = ["items", i, "menuOfferingId"];
        throw err;
      }

      const serviceDay = offering.menu?.serviceDay;
      const variant = offering.variant;
      const menuItem = variant?.menuItem;

      const isUnavailable =
        !offering.isAvailable ||
        !serviceDay ||
        !serviceDay.isPublished ||
        serviceDay.isClosed ||
        !variant ||
        !variant.isActive ||
        !menuItem ||
        !menuItem.isActive ||
        menuItem.archivedAt !== null;

      if (isUnavailable) {
        const err = new Error("Item is unavailable");
        err.code = "OFFERING_UNAVAILABLE";
        err.path = ["items", i, "menuOfferingId"];
        throw err;
      }

      // Calculation
      const unitPriceCents = offering.priceOverrideCents ?? variant.basePriceCents;
      const lineTotalCents = unitPriceCents * inputItem.quantity;
      subtotalCents += lineTotalCents;

      // Grouping
      const dayId = serviceDay.id;
      if (!groupMap.has(dayId)) {
        groupMap.set(dayId, {
          serviceDayId: dayId,
          serviceDate: serviceDay.serviceDate.toISOString(),
          label: serviceDay.label, // nullable
          timestamp: serviceDay.serviceDate.getTime(), // for sorting
          items: []
        });
      }

      groupMap.get(dayId).items.push({
        menuOfferingId: offering.id,
        menuVariantId: variant.id,
        menuItemId: menuItem.id,
        name: menuItem.name,
        variantLabel: variant.label,
        imageUrl: menuItem.imageUrl, // nullable
        unitPriceCents,
        quantity: inputItem.quantity,
        lineTotalCents
      });
    }

    // Sort groups by serviceDate (timestamp)
    const groups = Array.from(groupMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((g, idx) => ({
        serviceDayId: g.serviceDayId,
        serviceDate: g.serviceDate,
        label: g.label,
        sequence: idx,
        items: g.items
      }));

    // 3. Delivery & Totals
    const adjustments = [];
    let delivery = null;
    let checkoutAllowed = true;
    const issues = [];

    if (fulfillment.method === "delivery") {
      try {
        const quote = await this.getDeliveryQuote(fulfillment.destination);
        
        delivery = {
          distanceMiles: quote.distanceMiles,
          maxMiles: quote.maxMiles,
          isInRange: quote.isInRange,
          deliveryFeeCents: quote.deliveryFeeCents
        };

        // Always include the fee adjustment for delivery (even if out of range)
        // so UI can show the full blocked quote.
        adjustments.push({
          type: "delivery_fee",
          label: "Delivery fee",
          amountCents: quote.deliveryFeeCents
        });
        
        if (!quote.isInRange) {
          checkoutAllowed = false;
          issues.push({
            code: "DELIVERY_OUT_OF_RANGE",
            message: `Delivery distance ${quote.distanceMiles} miles exceeds limit of ${quote.maxMiles} miles.`
          });
        }

      } catch (err) {
        if (err.code === "DELIVERY_DISABLED") {
          // Propagate as 400 error per requirements
          throw err;
        }
        // Other errors bubble up as 500
        throw err;
      }
    }

    // 4. Final Totals
    const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.amountCents, 0);
    const totalCents = subtotalCents + adjustmentsTotal;

    return {
      currency: "USD",
      fulfillmentType: fulfillment.method,
      checkoutAllowed,
      issues,
      subtotalCents,
      adjustments,
      totalCents,
      delivery,
      groups
    };
  }
}

module.exports = new CheckoutService();