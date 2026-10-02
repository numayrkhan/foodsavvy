const express = require("express");
const router = express.Router();
// Corrected relative path to services (was missing one level)
const deliveryService = require("../../../services/v2/admin/delivery.service");
const {
  DeliverySettingsResponseSchema,
  UpdateDeliverySettingsBodySchema,
} = require("../../../schemas/v2/admin/delivery.schema");

function mapZodErrors(err) {
  return err.errors.map((e) => ({
    code: "INVALID_INPUT",
    message: e.message,
    path: e.path,
  }));
}

// GET /api/v2/admin/delivery/settings
router.get("/settings", async (req, res) => {
  try {
    const data = await deliveryService.getSettings();
    // Validate outgoing data against contract
    const validated = DeliverySettingsResponseSchema.parse(data);
    return res.json({ ok: true, data: validated });
  } catch (err) {
    console.error("[V2 Admin Delivery] GET Error:", err);
    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_ERROR", message: "Failed to load settings.", path: [] }],
    });
  }
});

// PATCH /api/v2/admin/delivery/settings
router.patch("/settings", async (req, res) => {
  try {
    const parsed = UpdateDeliverySettingsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, errors: mapZodErrors(parsed.error) });
    }

    const data = await deliveryService.updateSettings(parsed.data);
    const validated = DeliverySettingsResponseSchema.parse(data);

    return res.json({ ok: true, data: validated });
  } catch (err) {
    console.error("[V2 Admin Delivery] PATCH Error:", err);
    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_ERROR", message: "Failed to update settings.", path: [] }],
    });
  }
});

module.exports = router;