// server/routes/admin/menus.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function shapeItem(i) {
  const addOns = (i.menuItemAddOns || []).map((r) => r.addOn);
  const { menuItemAddOns, ...rest } = i;
  return { ...rest, addOns };
}

/* =========================
   MENU-ITEMS under /menus
   ========================= */

// Add near the top:
const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  const diff = (dt.getDay() + 6) % 7; // Monday-based week
  dt.setDate(dt.getDate() - diff);
  return dt;
}

async function getOrCreateMenuByWeek(weekday, weekOf) {
  if (weekOf) {
    let m = await prisma.menu.findFirst({
      where: { serviceDay: weekday, weekOf },
    });
    if (!m) {
      m = await prisma.menu.create({
        data: {
          name: `${DAY_LABEL[weekday]} ${weekOf.toISOString().slice(0, 10)}`,
          serviceDay: weekday,
          weekOf,
          isTemplate: false,
          isActive: true,
        },
      });
    }
    return m;
  }
  // template
  let t = await prisma.menu.findFirst({
    where: { serviceDay: weekday, isTemplate: true },
  });
  if (!t) {
    t = await prisma.menu.create({
      data: {
        name: `${DAY_LABEL[weekday]} Template`,
        serviceDay: weekday,
        isTemplate: true,
        isActive: true,
      },
    });
  }
  return t;
}

// GET /api/admin/menus/by-day?weekday=1&weekOf=YYYY-MM-DD
router.get("/menus/by-day", async (req, res) => {
  const weekday = Number(req.query.weekday);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return res.status(400).json({ error: "Invalid weekday (0–6)" });
  }
  const weekOf = req.query.weekOf ? startOfWeek(req.query.weekOf) : null;

  const where = weekOf
    ? { serviceDay: weekday, weekOf }
    : { serviceDay: weekday, isTemplate: true };

  const menu = await prisma.menu.findFirst({
    where,
    include: {
      items: {
        // Show archived? Leave off this filter to see all; add where:{archived:false} to hide.
        orderBy: { id: "asc" },
        include: {
          variants: { orderBy: { priceCents: "asc" } },
          menuItemAddOns: { include: { addOn: true } },
          category: true,
        },
      },
    },
  });

  res.json({
    items: (menu?.items || []).map(shapeItem),
    meta: { weekOf: menu?.weekOf ?? null, isTemplate: !!menu?.isTemplate },
  });
});

// POST /api/admin/menus/item
// body: { id?, weekday, weekOf?, name, description?, imageUrl?, categoryId? }
router.post("/menus/item", async (req, res) => {
  try {
    const {
      id,
      weekday,
      weekOf: weekStr,
      name,
      description,
      imageUrl,
      categoryId = null,
    } = req.body;

    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: "weekday (0–6) required" });
    }
    if (!name?.trim()) return res.status(400).json({ error: "name required" });

    const weekOf = weekStr ? startOfWeek(weekStr) : null;
    const menu = await getOrCreateMenuByWeek(weekday, weekOf);

    const data = {
      name: name.trim(),
      description: (description || "").trim() || null,
      imageUrl: imageUrl || null,
      categoryId: categoryId ?? null,
      menuId: menu.id,
    };

    const row = id
      ? await prisma.menuItem.update({
          where: { id: Number(id) },
          data,
          include: {
            variants: true,
            category: true,
            menuItemAddOns: { include: { addOn: true } },
          },
        })
      : await prisma.menuItem.create({
          data,
          include: {
            variants: true,
            category: true,
            menuItemAddOns: { include: { addOn: true } },
          },
        });

    res.json(shapeItem(row));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Save failed" });
  }
});

// POST /api/admin/menus/copy  { fromWeekday, toWeekday, mode: "append"|"replace" }
router.post("/menus/copy", async (req, res) => {
  const { fromWeekday, toWeekday, mode = "append" } = req.body;

  if (
    ![fromWeekday, toWeekday].every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 6
    )
  ) {
    return res.status(400).json({ error: "Weekdays must be 0–6" });
  }

  const src = await prisma.menu.findFirst({
    where: { serviceDay: fromWeekday },
    include: { items: { include: { variants: true, menuItemAddOns: true } } },
  });
  if (!src)
    return res.status(404).json({ error: "Source weekday has no menu" });

  const dst = await getOrCreateMenuByWeek(toWeekday, null);

  if (mode === "replace") {
    const ids = (
      await prisma.menuItem.findMany({
        where: { menuId: dst.id },
        select: { id: true },
      })
    ).map((r) => r.id);
    if (ids.length) {
      await prisma.menuItemAddOns
        .deleteMany({ where: { menuItemId: { in: ids } } })
        .catch(() => {});
      await prisma.menuVariant
        .deleteMany({ where: { menuItemId: { in: ids } } })
        .catch(() => {});
      await prisma.menuItem.deleteMany({ where: { id: { in: ids } } });
    }
  }

  for (const it of src.items) {
    const newItem = await prisma.menuItem.create({
      data: {
        name: it.name,
        description: it.description,
        imageUrl: it.imageUrl,
        menuId: dst.id,
        categoryId: it.categoryId,
      },
    });
    for (const v of it.variants) {
      await prisma.menuVariant.create({
        data: {
          label: v.label,
          priceCents: v.priceCents,
          menuItemId: newItem.id,
        },
      });
    }
    if (Array.isArray(it.menuItemAddOns) && it.menuItemAddOns.length) {
      for (const link of it.menuItemAddOns) {
        await prisma.menuItemAddOns.create({
          data: { menuItemId: newItem.id, addOnId: link.addOnId },
        });
      }
    }
  }

  const result = await prisma.menu.findFirst({
    where: { id: dst.id },
    include: {
      items: {
        include: {
          variants: true,
          menuItemAddOns: { include: { addOn: true } },
        },
      },
    },
  });

  res.json({
    items: (result?.items || []).map(shapeItem),
  });
});

// POST /api/admin/menus/start-week  { weekOf:"YYYY-MM-DD", weekdays?: [1,2,3] }
router.post("/menus/start-week", async (req, res) => {
  const weekStr = req.body.weekOf;
  if (!weekStr)
    return res.status(400).json({ error: "weekOf (YYYY-MM-DD) required" });

  const target = startOfWeek(weekStr);
  const only = Array.isArray(req.body.weekdays) ? req.body.weekdays : null;

  for (let d = 0; d < 7; d++) {
    if (only && !only.includes(d)) continue;

    const tmpl = await prisma.menu.findFirst({
      where: { serviceDay: d, isTemplate: true },
      include: { items: { include: { variants: true, menuItemAddOns: true } } },
    });
    if (!tmpl) continue;

    // Create or clear that day's menu for the target week
    let dst = await prisma.menu.findFirst({
      where: { serviceDay: d, weekOf: target },
    });
    if (dst) {
      const ids = (
        await prisma.menuItem.findMany({
          where: { menuId: dst.id },
          select: { id: true },
        })
      ).map((r) => r.id);
      if (ids.length) {
        await prisma.menuItemAddOns
          .deleteMany({ where: { menuItemId: { in: ids } } })
          .catch(() => {});
        await prisma.menuVariant
          .deleteMany({ where: { menuItemId: { in: ids } } })
          .catch(() => {});
        await prisma.menuItem.deleteMany({ where: { id: { in: ids } } });
      }
    } else {
      dst = await prisma.menu.create({
        data: {
          name: `${DAY_LABEL[d]} ${target.toISOString().slice(0, 10)}`,
          serviceDay: d,
          weekOf: target,
          isTemplate: false,
          isActive: true,
        },
      });
    }

    // Copy items (+ variants + add-on links)
    for (const it of tmpl.items) {
      const newItem = await prisma.menuItem.create({
        data: {
          name: it.name,
          description: it.description,
          imageUrl: it.imageUrl,
          categoryId: it.categoryId,
          menuId: dst.id,
        },
      });
      for (const v of it.variants) {
        await prisma.menuVariant.create({
          data: {
            label: v.label,
            priceCents: v.priceCents,
            menuItemId: newItem.id,
          },
        });
      }
      if (Array.isArray(it.menuItemAddOns) && it.menuItemAddOns.length) {
        for (const link of it.menuItemAddOns) {
          await prisma.menuItemAddOns.create({
            data: { menuItemId: newItem.id, addOnId: link.addOnId },
          });
        }
      }
    }
  }

  res.json({ ok: true, weekOf: target.toISOString().slice(0, 10) });
});

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

// DELETE /api/admin/menus/:id
router.delete("/menus/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "Invalid id" });

  try {
    const orderRefs = await prisma.orderItem.count({
      where: { menuItemId: id },
    });
    if (orderRefs > 0) {
      // soft-delete: archived=true
      await prisma.menuItem.update({ where: { id }, data: { archived: true } });
      return res.status(200).json({ ok: true, softDeleted: true });
    }

    // hard-delete children then item
    await prisma.$transaction([
      prisma.menuItemAddOns.deleteMany({ where: { menuItemId: id } }),
      prisma.menuVariant.deleteMany({ where: { menuItemId: id } }),
      prisma.menuItem.delete({ where: { id } }),
    ]);
    res.status(204).end();
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
