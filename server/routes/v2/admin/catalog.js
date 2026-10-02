const express = require("express");
const router = express.Router();
const {
  CreateMenuItemBody,
  UpdateMenuItemParams,
  UpdateMenuItemBody,
  UpdateMenuVariantParams,
  UpdateMenuVariantBody,
  CreateMenuVariantParams,
  CreateMenuVariantBody,
} = require("../../../schemas/v2/admin/catalog.schema");
const {
  createMenuItem,
  updateMenuItem,
  updateMenuVariant,
  createMenuVariant,
} = require("../../../services/v2/admin/catalog.service");

function mapZodErrors(err) {
  return err.errors.map((e) => ({
    code: "VALIDATION_ERROR",
    message: e.message,
    path: e.path,
  }));
}

// POST /api/v2/admin/catalog/menu-items (D1)
router.post("/menu-items", async (req, res) => {
  try {
    const body = CreateMenuItemBody.parse(req.body);
    const created = await createMenuItem(body);
    return res.json({ ok: true, data: created });
  } catch (err) {
    console.error("Create Menu Item Error:", err);

    if (err.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(err) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to create menu item." }],
    });
  }
});

// PATCH /api/v2/admin/catalog/menu-items/:itemId (E2a)
router.patch("/menu-items/:itemId", async (req, res) => {
  try {
    const params = UpdateMenuItemParams.parse(req.params);
    const body = UpdateMenuItemBody.parse(req.body);

    const updated = await updateMenuItem(params.itemId, body);
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("Update Menu Item Error:", err);

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: err.message, path: ["params", "itemId"] }],
      });
    }

    if (err.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(err) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to update menu item." }],
    });
  }
});

// PATCH /api/v2/admin/catalog/menu-variants/:variantId (E2b)
router.patch("/menu-variants/:variantId", async (req, res) => {
  try {
    const params = UpdateMenuVariantParams.parse(req.params);
    const body = UpdateMenuVariantBody.parse(req.body);

    const updated = await updateMenuVariant(params.variantId, body);
    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("Update Menu Variant Error:", err);

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: err.message, path: ["params", "variantId"] }],
      });
    }

    if (err.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(err) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to update variant." }],
    });
  }
});

// POST /api/v2/admin/catalog/menu-items/:itemId/variants (E2c)
router.post("/menu-items/:itemId/variants", async (req, res) => {
  try {
    const { itemId } = CreateMenuVariantParams.parse(req.params);
    const body = CreateMenuVariantBody.parse(req.body);

    const result = await createMenuVariant(itemId, body);
    return res.json({ ok: true, data: result });
  } catch (err) {
    console.error("Create Menu Variant Error:", err);

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        errors: [{ code: "NOT_FOUND", message: err.message, path: ["params", "itemId"] }],
      });
    }

    if (err.code === "DUPLICATE_LABEL") {
      return res.status(409).json({
        ok: false,
        errors: [{ code: "DUPLICATE_LABEL", message: err.message, path: ["body", "label"] }],
      });
    }

    if (err.name === "ZodError") {
      return res.status(400).json({ ok: false, errors: mapZodErrors(err) });
    }

    return res.status(500).json({
      ok: false,
      errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Failed to create menu variant." }],
    });
  }
});

module.exports = router;