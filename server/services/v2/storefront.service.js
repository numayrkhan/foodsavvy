// Path sanity check: server/services/v2/storefront.service.js
// ../../db resolves to server/db.js
const prisma = require("../../db");

const BUSINESS_TZ = process.env.BUSINESS_TIMEZONE || "America/New_York";

/**
 * Returns "YYYY-MM-DD" for the given date in the target timezone.
 */
function dateKeyInTimeZone(date, tz) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${year}-${month}-${day}`;
}

/**
 * Converts "YYYY-MM-DD" string to a Date object at 12:00:00 UTC.
 * This matches the standard menuDate storage convention.
 */
function dateKeyToUTCNoon(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

class StorefrontService {
  /**
   * Returns "shoppable" days:
   * 1. Published & Open (ServiceDay level only)
   * 2. menuDate >= Today (in Business Timezone)
   * 3. Ordering cutoff (if set) is in the future
   * 4. Has at least one valid offering
   */
  async getOrderContext() {
    const now = new Date();
    
    // Calculate "Today" based on business timezone, not UTC.
    // This ensures late-night US orders still see "today's" menu 
    // even if UTC has crossed into tomorrow.
    const todayKey = dateKeyInTimeZone(now, BUSINESS_TZ);
    const startWindow = dateKeyToUTCNoon(todayKey);

    const serviceDays = await prisma.serviceDay.findMany({
      where: {
        isPublished: true,
        isClosed: false,
        // Show days starting from today (Business Timezone)
        menuDate: { gte: startWindow },
        // Cutoff must be null OR in the future
        OR: [
          { orderingCutoffAt: null },
          { orderingCutoffAt: { gt: now } }
        ],
        // Must have at least one valid offering to be worth showing
        menus: {
          some: {
            // No menu-level filtering (isPublished/isActive)
            offerings: {
              some: {
                isAvailable: true,
                variant: {
                  isActive: true,
                  menuItem: { 
                    isActive: true,
                    archivedAt: null // Ensure item isn't archived
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        menuDate: "asc",
      },
      select: {
        id: true,
        menuDate: true,
        serviceDate: true,
        label: true,
        orderingCutoffAt: true,
      }
    });

    return {
      serverTimeIso: now.toISOString(),
      serviceDays: serviceDays.map(day => ({
        ...day,
        menuDate: day.menuDate.toISOString(),
        serviceDate: day.serviceDate.toISOString(),
        orderingCutoffAt: day.orderingCutoffAt ? day.orderingCutoffAt.toISOString() : null
      }))
    };
  }

  /**
   * Returns the full menu for a specific ServiceDay.
   * Resolves overrides (price, capacity) and flattens structure.
   */
  async getMenuOfferings(serviceDayId) {
    const now = new Date();
    
    // Same timezone-aware window logic for consistency
    const todayKey = dateKeyInTimeZone(now, BUSINESS_TZ);
    const startWindow = dateKeyToUTCNoon(todayKey);

    // 1. Fetch Day with Deep Relations
    const serviceDay = await prisma.serviceDay.findFirst({
      where: {
        id: serviceDayId,
        isPublished: true,
        isClosed: false,
        menuDate: { gte: startWindow },
        OR: [
          { orderingCutoffAt: null },
          { orderingCutoffAt: { gt: now } }
        ],
      },
      include: {
        menus: {
          // No menu-level filtering
          include: {
            offerings: {
              where: {
                isAvailable: true,
                variant: {
                  isActive: true,
                  menuItem: { 
                    isActive: true,
                    archivedAt: null
                  }
                }
              },
              include: {
                variant: {
                  include: {
                    menuItem: {
                      include: {
                        category: true,
                        addOnLinks: {
                          include: { addOn: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!serviceDay) {
      return null;
    }

    // 2. Flatten & Transform
    // Sort menus by displayOrder first
    const sortedMenus = serviceDay.menus.sort((a, b) => a.displayOrder - b.displayOrder);
    const offerings = [];

    for (const menu of sortedMenus) {
      // Sort offerings by position
      const sortedOfferings = menu.offerings.sort((a, b) => a.position - b.position);

      for (const off of sortedOfferings) {
        const variant = off.variant;
        const item = variant.menuItem;

        // Resolve Overrides
        const priceCents = off.priceOverrideCents !== null 
          ? off.priceOverrideCents 
          : variant.basePriceCents;
          
        const capacity = off.capacityOverride !== null 
          ? off.capacityOverride 
          : variant.baseCapacity;

        // Map AddOns
        // Note: item.addOnLinks is the join table (MenuItemAddOn)
        const addOns = (item.addOnLinks || [])
          .filter(link => link.addOn && link.addOn.isActive)
          .map(link => ({
            id: link.addOn.id,
            name: link.addOn.name,
            priceCents: link.addOn.priceCents,
            maxQtyPerItem: link.maxQtyPerItem
          }));

        offerings.push({
          id: off.id,
          menuVariantId: variant.id,
          isAvailable: off.isAvailable,
          maxPerOrder: off.maxPerOrder,
          priceCents: priceCents,
          basePriceCents: variant.basePriceCents,
          capacity: capacity,
          baseCapacity: variant.baseCapacity,
          variant: {
            label: variant.label,
          },
          item: {
            id: item.id,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            categoryId: item.categoryId,
            categoryName: item.category?.name,
            nutrition: item.nutrition,
            allergens: item.allergens,
            addOns: addOns,
          }
        });
      }
    }

    return {
      serviceDay: {
        id: serviceDay.id,
        label: serviceDay.label,
        serviceDate: serviceDay.serviceDate.toISOString(),
      },
      offerings
    };
  }
}

module.exports = new StorefrontService();