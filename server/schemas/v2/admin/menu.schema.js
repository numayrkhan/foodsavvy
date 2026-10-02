const { z } = require("zod");

// --- SLICE A: CONTEXT ---
const GetMenuContextQuery = z.object({
  serviceDayId: z.coerce.number().int().positive().optional(),
});

const MenuContextResponse = z.object({
  constants: z.object({
    menuTypes: z.array(z.enum(["EVERYDAY", "LUNCH", "DINNER", "SPECIAL"])),
  }),
  catalog: z.object({
    categories: z.array(z.object({ 
      id: z.number(), 
      name: z.string(), 
      position: z.number() 
    })),
    items: z.array(z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().nullable(),
      imageUrl: z.string().nullable(),
      categoryId: z.number().nullable(),
      isActive: z.boolean(),
      nutrition: z.any().nullable(), // <--- Slice E1
      allergens: z.any().nullable(), // <--- Slice E1
      variants: z.array(z.object({
        id: z.number(),
        label: z.string(),
        basePriceCents: z.number(),
        baseCapacity: z.number().nullable(),
        isActive: z.boolean()
      })),
      allowedAddOns: z.array(z.object({
        addOnId: z.number(),
        maxQtyPerItem: z.number().nullable()
      }))
    })),
    addOns: z.array(z.object({ 
      id: z.number(), 
      name: z.string(), 
      priceCents: z.number(), 
      isActive: z.boolean() 
    }))
  }),
  schedule: z.object({
    serviceDays: z.array(z.object({
      id: z.number(),
      menuDate: z.string().datetime(),
      serviceDate: z.string().datetime(),
      label: z.string().nullable(),
      isPublished: z.boolean(),
      isClosed: z.boolean(),
      closedReason: z.string().nullable(),
      orderingCutoffAt: z.string().datetime().nullable()
    })),
    slotTemplates: z.array(z.object({
      id: z.number(),
      label: z.string(),
      startMin: z.number(),
      endMin: z.number(),
      defaultCapacity: z.number(),
      isActive: z.boolean()
    }))
  }),
  activeContext: z.nullable(z.object({
    serviceDayId: z.number(),
    menus: z.array(z.object({
      id: z.number(),
      title: z.string().nullable(),
      displayOrder: z.number().default(0),
      menuType: z.enum(["EVERYDAY", "LUNCH", "DINNER", "SPECIAL"]),
      isPublished: z.boolean(),
      offerings: z.array(z.object({
        id: z.number(),
        menuVariantId: z.number(),
        position: z.number().default(0),
        priceOverrideCents: z.number().nullable(),
        capacityOverride: z.number().nullable(),
        isAvailable: z.boolean(),
        maxPerOrder: z.number().nullable()
      }))
    }))
  }))
});

// --- SLICE B3: CREATE/ENSURE MENUS ---
const CreateMenusParams = z.object({
  serviceDayId: z.coerce.number().int().positive(),
});

const CreateMenusBody = z.object({
  menus: z.array(z.object({
    menuType: z.enum(["EVERYDAY", "LUNCH", "DINNER", "SPECIAL"]),
    title: z.string().optional().nullable(),
    displayOrder: z.number().int().default(0),
    isPublished: z.boolean().default(false)
  }))
  .min(1)
  .refine((items) => {
    const types = items.map(i => i.menuType);
    return new Set(types).size === types.length;
  }, {
    message: "Duplicate menuTypes are not allowed in a single request",
    path: ["menus"]
  })
});

const CreateMenusResponse = z.object({
  summary: z.object({
    requested: z.number(),
    created: z.number(),
    existed: z.number()
  }),
  results: z.array(z.object({
    menuType: z.string(),
    status: z.enum(["CREATED", "EXISTS"]),
    menu: z.object({
      id: z.number(),
      serviceDayId: z.number(),
      menuType: z.string(),
      title: z.string().nullable(),
      displayOrder: z.number(),
      isPublished: z.boolean()
    })
  }))
});

// --- SLICE B4: BATCH REPLACE OFFERINGS ---
const UpdateOfferingsParams = z.object({
  menuId: z.coerce.number().int().positive()
});

const UpdateOfferingsBody = z.object({
  offerings: z.array(z.object({
    menuVariantId: z.number().int().positive(),
    position: z.number().int().min(0).default(0),
    isAvailable: z.boolean().default(true),
    priceOverrideCents: z.number().int().min(0).nullable().default(null),
    capacityOverride: z.number().int().min(0).nullable().default(null),
    maxPerOrder: z.number().int().min(1).nullable().default(null)
  }))
  .refine((items) => {
    const ids = items.map(i => i.menuVariantId);
    return new Set(ids).size === items.length;
  }, {
    message: "Duplicate menuVariantIds are not allowed in the offerings list",
    path: ["offerings"]
  })
});

const UpdateOfferingsResponse = z.object({
  menuId: z.number(),
  count: z.number(),
  offerings: z.array(z.object({
    id: z.number(),
    menuVariantId: z.number(),
    position: z.number(),
    priceOverrideCents: z.number().nullable(),
    capacityOverride: z.number().nullable(),
    isAvailable: z.boolean(),
    maxPerOrder: z.number().nullable()
  }))
});

module.exports = {
  GetMenuContextQuery,
  MenuContextResponse,
  CreateMenusParams,
  CreateMenusBody,
  CreateMenusResponse,
  UpdateOfferingsParams,
  UpdateOfferingsBody,
  UpdateOfferingsResponse
};