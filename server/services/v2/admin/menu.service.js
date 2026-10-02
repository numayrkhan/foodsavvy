const prisma = require("../../../db");

/**
 * Fetch Context for Menu Editor (Slice A + E1)
 */
const getContext = async (serviceDayId) => {
  const constants = {
    menuTypes: ["EVERYDAY", "LUNCH", "DINNER", "SPECIAL"],
  };

  const [categories, itemsRaw, addOns] = await Promise.all([
    prisma.category.findMany({ 
      orderBy: { position: "asc" } 
    }),
    prisma.menuItem.findMany({
      where: { archivedAt: null },
      include: {
        variants: {
          orderBy: { basePriceCents: "asc" },
        },
        addOnLinks: true, 
      },
      orderBy: { name: "asc" },
    }),
    prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const items = itemsRaw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    categoryId: item.categoryId,
    isActive: item.isActive,
    nutrition: item.nutrition, // <--- Slice E1
    allergens: item.allergens, // <--- Slice E1
    variants: item.variants.map((v) => ({
      id: v.id,
      label: v.label,
      basePriceCents: v.basePriceCents,
      baseCapacity: v.baseCapacity,
      isActive: v.isActive,
    })),
    allowedAddOns: item.addOnLinks.map((link) => ({
      addOnId: link.addOnId,
      maxQtyPerItem: link.maxQtyPerItem,
    })),
  }));

  const mappedAddOns = addOns.map(a => ({
    id: a.id,
    name: a.name,
    priceCents: a.priceCents,
    isActive: a.isActive
  }));

  const [serviceDaysRaw, slotTemplatesRaw] = await Promise.all([
    prisma.serviceDay.findMany({
      orderBy: { serviceDate: "asc" },
    }),
    prisma.slotTemplate.findMany({
      where: { isActive: true },
      orderBy: { startMin: "asc" },
    }),
  ]);

  const schedule = {
    serviceDays: serviceDaysRaw.map((d) => ({
      id: d.id,
      menuDate: d.menuDate.toISOString(),
      serviceDate: d.serviceDate.toISOString(),
      label: d.label,
      isPublished: d.isPublished,
      isClosed: d.isClosed,
      closedReason: d.closedReason,
      orderingCutoffAt: d.orderingCutoffAt ? d.orderingCutoffAt.toISOString() : null,
    })),
    slotTemplates: slotTemplatesRaw.map(t => ({
      id: t.id,
      label: t.label,
      startMin: t.startMin,
      endMin: t.endMin,
      defaultCapacity: t.defaultCapacity,
      isActive: t.isActive
    })),
  };

  let activeContext = null;
  if (serviceDayId) {
    const day = await prisma.serviceDay.findUnique({
      where: { id: serviceDayId },
      include: {
        menus: {
          orderBy: { displayOrder: 'asc' },
          include: {
            offerings: {
               orderBy: { position: 'asc' }
            },
          },
        },
      },
    });

    if (!day) {
      const error = new Error("ServiceDay not found");
      error.code = "NOT_FOUND";
      throw error;
    }

    activeContext = {
      serviceDayId: day.id,
      menus: day.menus.map((m) => ({
        id: m.id,
        title: m.title,
        displayOrder: m.displayOrder,
        menuType: m.menuType,
        isPublished: m.isPublished,
        offerings: m.offerings.map((o) => ({
          id: o.id,
          menuVariantId: o.menuVariantId,
          position: o.position,
          priceOverrideCents: o.priceOverrideCents,
          capacityOverride: o.capacityOverride,
          isAvailable: o.isAvailable,
          maxPerOrder: o.maxPerOrder,
        })),
      })),
    };
  }

  return {
    constants,
    catalog: { categories, items, addOns: mappedAddOns },
    schedule,
    activeContext,
  };
};

/**
 * Ensure Menus Exist (Slice B3)
 */
const ensureMenus = async (serviceDayId, menuPayloads) => {
  const day = await prisma.serviceDay.findUnique({
    where: { id: serviceDayId }
  });

  if (!day) {
    const error = new Error(`ServiceDay ${serviceDayId} not found`);
    error.code = "NOT_FOUND";
    throw error;
  }

  const results = [];
  const summary = { requested: menuPayloads.length, created: 0, existed: 0 };

  const MENU_SELECT = {
    id: true,
    serviceDayId: true,
    menuType: true,
    title: true,
    displayOrder: true,
    isPublished: true
  };

  for (const payload of menuPayloads) {
    const existing = await prisma.menu.findUnique({
      where: {
        serviceDayId_menuType: {
          serviceDayId,
          menuType: payload.menuType
        }
      },
      select: MENU_SELECT
    });

    if (existing) {
      summary.existed++;
      results.push({
        menuType: payload.menuType,
        status: "EXISTS",
        menu: existing
      });
    } else {
      const created = await prisma.menu.create({
        data: {
          serviceDayId,
          menuType: payload.menuType,
          title: payload.title || null,
          displayOrder: payload.displayOrder,
          isPublished: payload.isPublished
        },
        select: MENU_SELECT
      });
      summary.created++;
      results.push({
        menuType: payload.menuType,
        status: "CREATED",
        menu: created
      });
    }
  }

  return { summary, results };
};

/**
 * Batch Replace Menu Offerings (Slice B4)
 */
const replaceOfferings = async (menuId, offeringsPayload) => {
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) {
    const error = new Error(`Menu ${menuId} not found`);
    error.code = "NOT_FOUND";
    throw error;
  }

  if (offeringsPayload.length > 0) {
    const variantIds = offeringsPayload.map(o => o.menuVariantId);
    const count = await prisma.menuVariant.count({
      where: {
        id: { in: variantIds },
        isActive: true
      }
    });
    if (count !== variantIds.length) {
      const error = new Error("One or more MenuVariants are invalid or inactive");
      error.code = "INVALID_VARIANT";
      throw error;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuOffering.deleteMany({
      where: { menuId }
    });

    if (offeringsPayload.length > 0) {
      await tx.menuOffering.createMany({
        data: offeringsPayload.map(o => ({
          menuId,
          menuVariantId: o.menuVariantId,
          position: o.position,
          isAvailable: o.isAvailable,
          priceOverrideCents: o.priceOverrideCents,
          capacityOverride: o.capacityOverride,
          maxPerOrder: o.maxPerOrder
        }))
      });
    }
  });

  const freshOfferings = await prisma.menuOffering.findMany({
    where: { menuId },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      menuVariantId: true,
      position: true,
      priceOverrideCents: true,
      capacityOverride: true,
      isAvailable: true,
      maxPerOrder: true
    }
  });

  return {
    menuId,
    count: freshOfferings.length,
    offerings: freshOfferings
  };
};

module.exports = {
  getContext,
  ensureMenus,
  replaceOfferings
};