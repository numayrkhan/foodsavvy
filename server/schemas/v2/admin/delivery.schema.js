const { z } = require("zod");

const KitchenPatchSchema = z
  .object({
    address1: z.string().nullable().optional(),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict();

const PricingPatchSchema = z
  .object({
    maxMiles: z.number().min(0).optional(),
    rateCentsPerMile: z.number().int().min(0).optional(),
  })
  .strict();

const DeliverySettingsResponseSchema = z
  .object({
    kitchen: z
      .object({
        address1: z.string().nullable(),
        lat: z.number().nullable(),
        lng: z.number().nullable(),
      })
      .strict(),
    pricing: z
      .object({
        maxMiles: z.number().min(0),
        rateCentsPerMile: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();

const UpdateDeliverySettingsBodySchema = z
  .object({
    kitchen: KitchenPatchSchema.optional(),
    pricing: PricingPatchSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      const kitchenHas =
        data.kitchen && Object.keys(data.kitchen).some((k) => data.kitchen[k] !== undefined);
      const pricingHas =
        data.pricing && Object.keys(data.pricing).some((k) => data.pricing[k] !== undefined);
      return Boolean(kitchenHas || pricingHas);
    },
    {
      message: "Provide at least one field under 'kitchen' or 'pricing'.",
      path: [],
    }
  );

module.exports = {
  DeliverySettingsResponseSchema,
  UpdateDeliverySettingsBodySchema,
};