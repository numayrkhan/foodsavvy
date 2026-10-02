const prisma = require("../../../db");

function normalizeContains(arr) {
  if (!Array.isArray(arr)) return null;
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : null;
}

function safeMenuItem(item) {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl ?? null,
    description: item.description ?? null,
    categoryId: item.categoryId ?? null,
    nutrition: item.nutrition ?? null,
    allergens: item.allergens ?? null,
    isActive: item.isActive,
  };
}

// D1 create item
async function createMenuItem(input) {
  const nutrition =
    input.nutrition && Object.keys(input.nutrition).length > 0 ? input.nutrition : null;

  const contains = normalizeContains(input.contains);
  const allergens = contains ? { contains } : null;

  const created = await prisma.$transaction(async (tx) => {
    const menuItem = await tx.menuItem.create({
      data: {
        name: input.name,
        imageUrl: input.imageUrl ?? null,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        nutrition,
        allergens,
        isActive: true,

        variants: {
          create: input.variants.map((v) => ({
            label: v.label,
            basePriceCents: v.basePriceCents,
            baseCapacity: v.baseCapacity ?? null,
            isActive: true,
          })),
        },

        ...(input.allowedAddOns && input.allowedAddOns.length > 0
          ? {
              addOnLinks: {
                create: input.allowedAddOns.map((ao) => ({
                  addOnId: ao.addOnId,
                  maxQtyPerItem: ao.maxQtyPerItem ?? null,
                })),
              },
            }
          : {}),
      },
      include: {
        variants: true,
        addOnLinks: { include: { addOn: true } },
      },
    });

    // Return safe fields + variants + addon links
    return {
      ...safeMenuItem(menuItem),
      variants: menuItem.variants.map((v) => ({
        id: v.id,
        label: v.label,
        basePriceCents: v.basePriceCents,
        baseCapacity: v.baseCapacity,
        isActive: v.isActive,
      })),
      addOnLinks: menuItem.addOnLinks.map((link) => ({
        addOnId: link.addOnId,
        maxQtyPerItem: link.maxQtyPerItem,
        addOn: {
          id: link.addOn.id,
          name: link.addOn.name,
          priceCents: link.addOn.priceCents,
          isActive: link.addOn.isActive,
        },
      })),
    };
  });

  return created;
}

// E2a update item details
async function updateMenuItem(itemId, body) {
  const exists = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  });

  if (!exists) {
    const err = new Error(`MenuItem ${itemId} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  const updateData = {};

  if ("name" in body) updateData.name = body.name;
  if ("imageUrl" in body) updateData.imageUrl = body.imageUrl;
  if ("description" in body) updateData.description = body.description;
  if ("categoryId" in body) updateData.categoryId = body.categoryId;

  if ("nutrition" in body) {
    updateData.nutrition = body.nutrition; // object or null
  }

  if ("contains" in body) {
    const contains = normalizeContains(body.contains);
    updateData.allergens = contains ? { contains } : null;
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: updateData,
    select: {
      id: true,
      name: true,
      imageUrl: true,
      description: true,
      categoryId: true,
      nutrition: true,
      allergens: true,
      isActive: true,
    },
  });

  return safeMenuItem(updated);
}

// E2b update variant label
async function updateMenuVariant(variantId, body) {
  const exists = await prisma.menuVariant.findUnique({
    where: { id: variantId },
    select: { id: true },
  });

  if (!exists) {
    const err = new Error(`MenuVariant ${variantId} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  const updated = await prisma.menuVariant.update({
    where: { id: variantId },
    data: { label: body.label },
    select: {
      id: true,
      menuItemId: true,
      label: true,
      basePriceCents: true,
      baseCapacity: true,
      isActive: true,
    },
  });

  return updated;
}

// E2c create variant for existing item
async function createMenuVariant(itemId, body) {
  // 1. Check Item Exists
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) {
    const err = new Error(`MenuItem ${itemId} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  // 2. Check Uniqueness (Case-insensitive label per item)
  const existing = await prisma.menuVariant.findFirst({
    where: {
      menuItemId: itemId,
      label: { equals: body.label, mode: "insensitive" },
      isActive: true,
    },
  });

  if (existing) {
    const err = new Error(`Variant label "${body.label}" already exists for this item`);
    err.code = "DUPLICATE_LABEL";
    throw err;
  }

  // 3. Create
  const created = await prisma.menuVariant.create({
    data: {
      menuItemId: itemId,
      label: body.label,
      basePriceCents: body.basePriceCents,
      baseCapacity: body.baseCapacity ?? null,
      isActive: true,
    },
    select: {
      id: true,
      menuItemId: true,
      label: true,
      basePriceCents: true,
      baseCapacity: true,
      isActive: true,
    },
  });

  return created;
}

module.exports = {
  createMenuItem,
  updateMenuItem,
  updateMenuVariant,
  createMenuVariant,
};