const express = require("express");
const router = express.Router();

// FIXED IMPORTS: Go up 3 levels
const { 
  GetMenuContextQuery,
  UpdateOfferingsParams,
  UpdateOfferingsBody 
} = require("../../../schemas/v2/admin/menu.schema");

const MenuService = require("../../../services/v2/admin/menu.service");

// --- ROUTES ---
// Mounted at /api/v2/admin

// GET /api/v2/admin/menu-context
router.get("/menu-context", async (req, res) => {
  try {
    const query = GetMenuContextQuery.parse(req.query);
    const data = await MenuService.getContext(query.serviceDayId);
    res.json({ ok: true, data });
  } catch (error) {
    console.error("Menu Context Error:", error);

    if (error.code === "NOT_FOUND") {
       return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: error.message }]
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        errors: error.errors.map(e => ({
          code: "VALIDATION_ERROR", message: e.message, path: e.path
        })),
      });
    }

    res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." }]
    });
  }
});

// PUT /api/v2/admin/menus/:menuId/offerings
router.put("/menus/:menuId/offerings", async (req, res) => {
  try {
    // 1. Validate Params & Body
    const params = UpdateOfferingsParams.parse(req.params);
    const body = UpdateOfferingsBody.parse(req.body);

    // 2. Execute Service
    const data = await MenuService.replaceOfferings(params.menuId, body.offerings);

    // 3. Return Success
    res.json({ ok: true, data });

  } catch (error) {
    console.error("Replace Offerings Error:", error);

    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: error.message, path: ["params", "menuId"] }]
      });
    }

    if (error.code === "INVALID_VARIANT") {
      return res.status(400).json({
        ok: false,
        errors: [{ code: "INVALID_VARIANT", message: error.message, path: ["body", "offerings"] }]
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        errors: error.errors.map(e => ({
          code: "VALIDATION_ERROR", message: e.message, path: e.path
        })),
      });
    }

    res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to update menu offerings." }]
    });
  }
});

module.exports = router;