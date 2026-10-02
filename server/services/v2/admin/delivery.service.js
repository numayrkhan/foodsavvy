// server/services/v2/admin/delivery.service.js
const prisma = require("../../../db");

function mapToResponse(row) {
  return {
    kitchen: {
      address1: row.originAddress ? row.originAddress : null,
      lat: row.originLat ?? null,
      lng: row.originLng ?? null,
    },
    pricing: {
      maxMiles: row.maxRadiusMiles ?? 0,
      rateCentsPerMile: row.rateCentsPerMile ?? 0,
    },
  };
}

class AdminDeliveryService {
  async getSettings() {
    const row = await prisma.deliverySettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        originAddress: "",
        originLat: null,
        originLng: null,
        maxRadiusMiles: 0,
        // legacy field (keep if it exists in your schema)
        feeTiers: [],
        // new field
        rateCentsPerMile: 0,
      },
    });

    return mapToResponse(row);
  }

  async updateSettings(payload) {
    const data = {};

    if (payload.kitchen) {
      if (payload.kitchen.address1 !== undefined) data.originAddress = payload.kitchen.address1 || "";
      if (payload.kitchen.lat !== undefined) data.originLat = payload.kitchen.lat;
      if (payload.kitchen.lng !== undefined) data.originLng = payload.kitchen.lng;
    }

    if (payload.pricing) {
      if (payload.pricing.maxMiles !== undefined) data.maxRadiusMiles = payload.pricing.maxMiles;
      if (payload.pricing.rateCentsPerMile !== undefined) data.rateCentsPerMile = payload.pricing.rateCentsPerMile;
    }

    const row = await prisma.deliverySettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        originAddress: "",
        originLat: null,
        originLng: null,
        maxRadiusMiles: 0,
        feeTiers: [],
        rateCentsPerMile: 0,
        ...data,
      },
    });

    return mapToResponse(row);
  }
}

module.exports = new AdminDeliveryService();