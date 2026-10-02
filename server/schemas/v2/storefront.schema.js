const { z } = require("zod");

// --- Request Schemas ---

const GetMenuOfferingsParamsSchema = z.object({
  serviceDayId: z.coerce.number().int().positive(),
});

// --- Response Schemas ---

const ServiceDaySummarySchema = z.object({
  id: z.number(),
  menuDate: z.string().datetime(),
  serviceDate: z.string().datetime(),
  label: z.string().nullable(),
  orderingCutoffAt: z.string().datetime().nullable(),
});

const OrderContextResponseSchema = z.object({
  serverTimeIso: z.string().datetime(),
  serviceDays: z.array(ServiceDaySummarySchema),
});

const OfferingAddOnSchema = z.object({
  id: z.number(),
  name: z.string(),
  priceCents: z.number(),
  maxQtyPerItem: z.number().nullable(),
});

// Stricter Nutrition/Allergens shapes
const NutritionSchema = z.object({
  calories: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
}).nullable();

const AllergensSchema = z.object({
  contains: z.array(z.string().min(1)),
}).nullable();

const OfferingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  categoryId: z.number().nullable(),
  categoryName: z.string().optional(),
  nutrition: NutritionSchema.optional(),
  allergens: AllergensSchema.optional(),
  addOns: z.array(OfferingAddOnSchema),
});

const OfferingSchema = z.object({
  id: z.number(),
  menuVariantId: z.number(),
  isAvailable: z.boolean(),
  maxPerOrder: z.number().nullable(),
  priceCents: z.number(),
  basePriceCents: z.number(),
  capacity: z.number().nullable(),
  baseCapacity: z.number().nullable(),
  variant: z.object({
    label: z.string(),
  }),
  item: OfferingItemSchema,
});

const MenuOfferingsResponseSchema = z.object({
  serviceDay: z.object({
    id: z.number(),
    label: z.string().nullable(),
    serviceDate: z.string().datetime(),
  }),
  offerings: z.array(OfferingSchema),
});

module.exports = {
  GetMenuOfferingsParamsSchema,
  OrderContextResponseSchema,
  MenuOfferingsResponseSchema,
};