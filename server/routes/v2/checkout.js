const express = require("express");
const router = express.Router();
const checkoutService = require("../../services/v2/checkout.service");
const { 
  DeliveryQuoteBodySchema, 
  DeliveryQuoteResponseSchema,
  CheckoutQuoteBodySchema,
  CheckoutQuoteResponseSchema,
  CheckoutQuoteEnvelopeSchema
} = require("../../schemas/v2/checkout.schema");

/**
 * POST /api/v2/checkout/delivery-quote
 * Computes delivery fee based on DB settings.
 */
router.post("/delivery-quote", async (req, res) => {
  try {
    // 1. Validate Input (Robust Fix)
    const parsed = DeliveryQuoteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error.errors ?? [];
      return res.status(400).json({
        ok: false,
        errors: issues.map((e) => ({
          code: "INVALID_INPUT",
          message: e.message,
          path: e.path,
        })),
      });
    }

    // 2. Call Service
    const result = await checkoutService.getDeliveryQuote(parsed.data.destination);

    // 3. Validate Output & Respond
    const data = DeliveryQuoteResponseSchema.parse(result);
    res.json({ ok: true, data });

  } catch (error) {
    // Handle specific business logic error
    if (error.code === "DELIVERY_DISABLED") {
      return res.status(400).json({
        ok: false,
        errors: [{ 
          code: "DELIVERY_DISABLED", 
          message: error.message, 
          path: [] 
        }]
      });
    }

    console.error("[V2 Checkout] Delivery Quote Error:", error);
    res.status(500).json({
      ok: false,
      errors: [{ 
        code: "INTERNAL_ERROR", 
        message: "Failed to calculate delivery quote.", 
        path: [] 
      }]
    });
  }
});

/**
 * POST /api/v2/checkout/quote
 * Calculates full cart pricing, grouping, and delivery eligibility.
 */
router.post("/quote", async (req, res) => {
  try {
    // 1. Validate Input
    const parsed = CheckoutQuoteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error.errors ?? [];
      return res.status(400).json({
        ok: false,
        errors: issues.map((e) => ({
          code: "INVALID_INPUT",
          message: e.message,
          path: e.path,
        })),
      });
    }

    // 2. Call Service
    const result = await checkoutService.getCheckoutQuote(parsed.data);

    // 3. Validate Output & Respond (Envelope Strict Mode)
    // First ensure data matches its schema
    const data = CheckoutQuoteResponseSchema.parse(result);
    // Then ensure the full payload matches the envelope
    const payload = CheckoutQuoteEnvelopeSchema.parse({ ok: true, data });
    
    res.json(payload);

  } catch (error) {
    // Handle Item Validation Errors
    if (error.code === "OFFERING_NOT_FOUND" || error.code === "OFFERING_UNAVAILABLE") {
      return res.status(400).json({
        ok: false,
        errors: [{
          code: error.code,
          message: error.message,
          path: error.path || []
        }]
      });
    }

    // Handle Delivery Configuration Errors
    if (error.code === "DELIVERY_DISABLED") {
      return res.status(400).json({
        ok: false,
        errors: [{
          code: "DELIVERY_DISABLED",
          message: error.message,
          path: ["fulfillment"]
        }]
      });
    }

    console.error("[V2 Checkout] Quote Error:", error);
    res.status(500).json({
      ok: false,
      errors: [{ 
        code: "INTERNAL_ERROR", 
        message: "Failed to calculate checkout quote.", 
        path: [] 
      }]
    });
  }
});

module.exports = router;