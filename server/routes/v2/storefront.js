const express = require("express");
const router = express.Router();
// ../../services/v2 -> server/services/v2
const storefrontService = require("../../services/v2/storefront.service");
const { 
  GetMenuOfferingsParamsSchema, 
  OrderContextResponseSchema,
  MenuOfferingsResponseSchema 
} = require("../../schemas/v2/storefront.schema");

/**
 * Public Storefront Router
 * Mount: /api/v2
 */

// GET /api/v2/order-context
router.get("/order-context", async (req, res) => {
  try {
    const context = await storefrontService.getOrderContext();
    const validated = OrderContextResponseSchema.parse(context);
    res.json({ ok: true, data: validated });
  } catch (error) {
    console.error("[V2 Storefront] Order Context Error:", error);
    res.status(500).json({ 
      ok: false, 
      errors: [{ code: "INTERNAL_ERROR", message: "Failed to load order context", path: [] }] 
    });
  }
});

// GET /api/v2/menu-offerings/:serviceDayId
router.get("/menu-offerings/:serviceDayId", async (req, res) => {
  try {
    const params = GetMenuOfferingsParamsSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ 
        ok: false, 
        errors: params.error.errors.map(e => ({
          code: "INVALID_INPUT",
          message: e.message,
          path: e.path
        }))
      });
    }

    const result = await storefrontService.getMenuOfferings(params.data.serviceDayId);

    if (!result) {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: "Day not found or no longer available", path: ["serviceDayId"] }]
      });
    }

    const validated = MenuOfferingsResponseSchema.parse(result);
    res.json({ ok: true, data: validated });
  } catch (error) {
    console.error("[V2 Storefront] Menu Offerings Error:", error);
    res.status(500).json({ 
      ok: false, 
      errors: [{ code: "INTERNAL_ERROR", message: "Failed to load menu offerings", path: [] }] 
    });
  }
});

module.exports = router;