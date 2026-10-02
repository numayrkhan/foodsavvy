const { z } = require("zod");

// Reusable Destination Schema
const DestinationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
  address1: z.string().optional()
});

// Input: Destination coordinates (Existing)
const DeliveryQuoteBodySchema = z.object({
  destination: DestinationSchema
});

// Output: Calculated quote (Existing)
const DeliveryQuoteResponseSchema = z.object({
  distanceMiles: z.number().min(0),
  // Updated: enforced non-negative
  maxMiles: z.number().min(0),
  rateCentsPerMile: z.number().int().min(0),
  deliveryFeeCents: z.number().int().min(0),
  isInRange: z.boolean()
});

// --- CQ1: Checkout Quote Schemas ---

const CheckoutQuoteBodySchema = z.object({
  items: z.array(z.object({
    menuOfferingId: z.number().int().min(1),
    quantity: z.number().int().min(1).max(99)
  })).min(1),
  fulfillment: z.object({
    method: z.enum(["pickup", "delivery"]),
    destination: z.any().optional() // Validated in superRefine if method is delivery
  }).superRefine((data, ctx) => {
    if (data.method === "delivery") {
      const parsedDest = DestinationSchema.safeParse(data.destination);
      if (!parsedDest.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Destination (lat/lng) required for delivery",
          path: ["destination"]
        });
      }
    }
  })
});

const CheckoutQuoteResponseSchema = z.object({
  currency: z.literal("USD"),
  fulfillmentType: z.enum(["pickup", "delivery"]),
  checkoutAllowed: z.boolean(),
  issues: z.array(z.object({
    code: z.string(),
    message: z.string()
  })),
  subtotalCents: z.number().int().min(0),
  adjustments: z.array(z.object({
    type: z.string(),
    label: z.string(),
    amountCents: z.number().int()
  })),
  totalCents: z.number().int().min(0),
  delivery: z.nullable(z.object({
    distanceMiles: z.number(),
    maxMiles: z.number(),
    isInRange: z.boolean(),
    deliveryFeeCents: z.number().int()
  })),
  groups: z.array(z.object({
    serviceDayId: z.number().int(),
    serviceDate: z.string().datetime(),
    label: z.string().nullable(),
    sequence: z.number().int(),
    items: z.array(z.object({
      menuOfferingId: z.number().int(),
      menuVariantId: z.number().int(),
      menuItemId: z.number().int(),
      name: z.string(),
      variantLabel: z.string(),
      imageUrl: z.string().nullable(),
      unitPriceCents: z.number().int(),
      quantity: z.number().int(),
      lineTotalCents: z.number().int()
    }))
  }))
});

// Envelope Schema for strict validation of the full response
const CheckoutQuoteEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: CheckoutQuoteResponseSchema
});

module.exports = {
  DeliveryQuoteBodySchema,
  DeliveryQuoteResponseSchema,
  CheckoutQuoteBodySchema,
  CheckoutQuoteResponseSchema,
  CheckoutQuoteEnvelopeSchema
};