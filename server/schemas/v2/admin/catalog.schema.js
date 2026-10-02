const { z } = require("zod");

// Helpers
const emptyStringToNull = (val) => (val === "" ? null : val);

const VariantInput = z.object({
  label: z.string().min(1, "Variant label is required"),
  basePriceCents: z.coerce.number().int().min(0, "Price must be >= 0"),
  baseCapacity: z.preprocess(emptyStringToNull, z.coerce.number().int().min(0).nullable().optional()),
});

const AddOnLinkInput = z.object({
  addOnId: z.coerce.number().int().positive(),
  maxQtyPerItem: z.preprocess(emptyStringToNull, z.coerce.number().int().min(1).nullable().optional()),
});

// --------------------
// D1: Create Menu Item
// --------------------
const CreateMenuItemBody = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  description: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  categoryId: z.preprocess(emptyStringToNull, z.coerce.number().int().positive().nullable().optional()),

  nutrition: z
    .object({
      calories: z.preprocess(emptyStringToNull, z.coerce.number().min(0).nullable().optional()),
      fat: z.preprocess(emptyStringToNull, z.coerce.number().min(0).nullable().optional()),
      carbs: z.preprocess(emptyStringToNull, z.coerce.number().min(0).nullable().optional()),
      protein: z.preprocess(emptyStringToNull, z.coerce.number().min(0).nullable().optional()),
    })
    .optional(),

  contains: z.array(z.string().min(1)).optional(),

  variants: z.array(VariantInput).min(1, "At least one variant is required").refine(
    (arr) => new Set(arr.map((v) => v.label.trim().toLowerCase())).size === arr.length,
    { message: "Variant labels must be unique", path: ["variants"] }
  ),

  allowedAddOns: z.array(AddOnLinkInput).optional().refine(
    (arr) => !arr || new Set(arr.map((a) => a.addOnId)).size === arr.length,
    { message: "Duplicate addOnId is not allowed", path: ["allowedAddOns"] }
  ),
}).strict();

// --------------------
// E2a: Update Menu Item
// --------------------
const UpdateMenuItemParams = z.object({
  itemId: z.coerce.number().int().positive(),
});

const UpdateMenuItemBody = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),

  nutrition: z
    .object({
      calories: z.number().nullable().optional(),
      fat: z.number().nullable().optional(),
      carbs: z.number().nullable().optional(),
      protein: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),

  // Empty array clears allergens
  contains: z.array(z.string().min(1)).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
  path: [],
});

// --------------------
// E2b: Update Menu Variant
// --------------------
const UpdateMenuVariantParams = z.object({
  variantId: z.coerce.number().int().positive(),
});

const UpdateMenuVariantBody = z.object({
  label: z.string().trim().min(1, "Label is required"),
}).strict();

// --------------------
// E2c: Create Menu Variant (Add Size)
// --------------------
const CreateMenuVariantParams = z.object({
  itemId: z.coerce.number().int().positive(),
});

const CreateMenuVariantBody = z.object({
  label: z.string().trim().min(1, "Label is required"),
  basePriceCents: z.coerce.number().int().min(0, "Price must be >= 0"),
  baseCapacity: z.preprocess(emptyStringToNull, z.coerce.number().int().min(0).nullable().optional()),
}).strict();

module.exports = {
  CreateMenuItemBody,
  UpdateMenuItemParams,
  UpdateMenuItemBody,
  UpdateMenuVariantParams,
  UpdateMenuVariantBody,
  CreateMenuVariantParams,
  CreateMenuVariantBody,
};