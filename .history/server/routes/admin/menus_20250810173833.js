// server/routes/admin/menus.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Find an active Menu by type or create one */
async function resolveOrCreateMenuByType(menuType) {
  const now = new Date();
  let menu = await prisma.menu.findFirst({
    where: {
      type: menuType,
      releaseDate: { lte: now },
      expiresAt: { gt: now },
    },
    orderBy: { releaseDate: "desc" },
  });

  if (!menu) {
    let expiresAt;
    if (menuType === "everyday") {
      expiresAt = new Date("2099-12-31T23:59:59Z");
    } else if (menuType === "weekly") {
      const d = new Date();
      const day = d.getUTCDay(); // 0..6
      const delta = 6 - day; // to Saturday; then +1 to Sunday end
      d.setUTCDate(d.getUTCDate() + delta + 1);
      d.setUTCHours(23, 59, 59, 999);
      expiresAt = d;
    } else {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 30);
      expiresAt = d;
    }
    menu = await prisma.menu.create({
      data: { type: menuType, releaseDate: now, expiresAt },
    });
  }
  return menu;
}

function shapeItem(i) {
  const addOns = (i.menuItemAddOns || []).map((r) => r.addOn);
  const { menuItemAddOns, ...rest } = i;
  return { ...rest, addOns };
}

/* =========================
   MENU-ITEMS under /menus
   ========================= */

// LIST (include menu+variants+category+addOns)
router.get("/menus", async (_req, res) => {
  const items = await prisma.menuItem.findMany({
    include: {
      menu: true,
      variants: true,
      category: true,
      menuItemAddOns: { include: { addOn: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(items.map(shapeItem));
});

// CREATE (accepts menuType)
router.post("/menus", async (req, res) => {
  try {
    const { name, description, imageUrl, categoryId, menuType } = req.body;
    if (!name || !menuType) {
      return res.status(400).json({ error: "name and menuType are required" });
    }
    const menu = await resolveOrCreateMenuByType(menuType);

    const created = await prisma.menuItem.create({
      data: {
        name,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        menu: { connect: { id: menu.id } },
        ...(categoryId
          ? { category: { connect: { id: Number(categoryId) } } }
          : {}),
      },
      include: {
        menu: true,
        variants: true,
        category: true,
        menuItemAddOns: { include: { addOn: true } },
      },
    });

    res.status(201).json(shapeItem(created));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Create failed" });
  }
});

// UPDATE (optionally switch menu by menuType)
router.patch("/menus/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, imageUrl, categoryId, menuType } = req.body;

    const data = {
      name,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      categoryId: categoryId ?? null,
    };
    if (menuType) {
      const menu = await resolveOrCreateMenuByType(menuType);
      data.menuId = menu.id;
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
      include: {
        menu: true,
        variants: true,
        category: true,
        menuItemAddOns: { include: { addOn: true } },
      },
    });
    res.json(shapeItem(updated));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Update failed" });
  }
});

// DELETE (safe cleanup; block if order history)
router.delete("/menus/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const orderRefs = await prisma.orderItem.count({
      where: { menuItemId: id },
    });
    if (orderRefs > 0) {
      return res.status(409).json({ error: "Item has orders; cannot delete" });
    }
    await prisma.$transaction([
      prisma.menuItemAddOns.deleteMany({ where: { menuItemId: id } }),
      prisma.menuVariant.deleteMany({ where: { menuItemId: id } }),
    ]);
    await prisma.menuItem.delete({ where: { id } });
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Delete failed" });
  }
});

/* =========================
   VARIANTS (batch replace)
   ========================= */

router.put("/menus/:id/variants", async (req, res) => {
  const menuItemId = Number(req.params.id);
  const { variants = [] } = req.body;
  try {
    await prisma.$transaction([
      prisma.menuVariant.deleteMany({ where: { menuItemId } }),
      variants.length
        ? prisma.menuVariant.createMany({
            data: variants.map((v) => ({
              menuItemId,
              label: v.label,
              priceCents: Number(v.priceCents),
            })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
    ]);

    const fresh = await prisma.menuVariant.findMany({
      where: { menuItemId },
      orderBy: { id: "asc" },
    });
    res.json(fresh);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Saving variants failed" });
  }
});

/* =========================
   ADD‑ONS (batch link)
   ========================= */

router.put("/menus/:id/addons", async (req, res) => {
  const menuItemId = Number(req.params.id);
  const { addOnIds = [] } = req.body;
  try {
    await prisma.menuItemAddOns.deleteMany({ where: { menuItemId } });
    if (addOnIds.length) {
      await prisma.menuItemAddOns.createMany({
        data: addOnIds.map((addOnId) => ({ menuItemId, addOnId })),
        skipDuplicates: true,
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Linking add‑ons failed" });
  }
});

/* =========================
   CATEGORIES
   ========================= */
router.get("/categories", async (_req, res) => {
  const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(rows);
});
router.post("/categories", async (req, res) => {
  const created = await prisma.category.create({
    data: { name: req.body.name },
  });
  res.status(201).json(created);
});
router.put("/categories/:id", async (req, res) => {
  const updated = await prisma.category.update({
    where: { id: Number(req.params.id) },
    data: { name: req.body.name },
  });
  res.json(updated);
});
router.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } });
  res.sendStatus(204);
});

/* =========================
   ADD‑ONS CRUD
   ========================= */
router.get("/addons", async (_req, res) => {
  const rows = await prisma.addOn.findMany({ orderBy: { name: "asc" } });
  res.json(rows);
});
router.post("/addons", async (req, res) => {
  const { name, description, imageUrl, priceCents } = req.body;
  const created = await prisma.addOn.create({
    data: { name, description, imageUrl, priceCents: Number(priceCents) },
  });
  res.status(201).json(created);
});
router.put("/addons/:id", async (req, res) => {
  const { name, description, imageUrl, priceCents } = req.body;
  const updated = await prisma.addOn.update({
    where: { id: Number(req.params.id) },
    data: { name, description, imageUrl, priceCents: Number(priceCents) },
  });
  res.json(updated);
});
router.delete("/addons/:id", async (req, res) => {
  await prisma.addOn.delete({ where: { id: Number(req.params.id) } });
  res.sendStatus(204);
});

module.exports = router;
