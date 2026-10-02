const express = require("express");
const router = express.Router();

const {
  GenerateServiceDaysBody,
  UpdateServiceDayParams,
  UpdateServiceDayBody,
} = require("../../../schemas/v2/admin/service-day.schema");

const {
  CreateMenusBody,
  CreateMenusParams,
} = require("../../../schemas/v2/admin/menu.schema");

const ServiceDayService = require("../../../services/v2/admin/service-day.service");
const MenuService = require("../../../services/v2/admin/menu.service");

function mapZodErrors(err) {
  return err.errors.map((e) => ({
    code: "VALIDATION_ERROR",
    message: e.message,
    path: e.path,
  }));
}

// Mounted at /api/v2/admin/service-days

router.post("/generate", async (req, res) => {
  try {
    const body = GenerateServiceDaysBody.parse(req.body);
    const data = await ServiceDayService.generate(body);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Service Day Generation Error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(error) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate service days." }],
    });
  }
});

router.post("/:serviceDayId/menus", async (req, res) => {
  try {
    const params = CreateMenusParams.parse(req.params);
    const body = CreateMenusBody.parse(req.body);

    const data = await MenuService.ensureMenus(params.serviceDayId, body.menus);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Ensure Menus Error:", error);

    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: error.message, path: ["params", "serviceDayId"] }],
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(error) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to create/ensure menus." }],
    });
  }
});

router.patch("/:serviceDayId", async (req, res) => {
  try {
    const params = UpdateServiceDayParams.parse(req.params);
    const body = UpdateServiceDayBody.parse(req.body);

    const data = await ServiceDayService.updateServiceDay(params.serviceDayId, body);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Update Service Day Error:", error);

    if (error.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: error.message, path: ["params", "serviceDayId"] }],
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(error) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to update service day." }],
    });
  }
});

module.exports = router;
