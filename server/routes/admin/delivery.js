//
// server/routes/admin/delivery.js
const express = require("express");
const router = express.Router();
const prisma = require("../../db");

// GET full delivery config (settings + slots + blackouts)
router.get("/delivery/config", async (_req, res) => {
  try {
    const settings = await prisma.deliverySettings.findUnique({ where: { id: 1 }});
    const slots = await prisma.slotTemplate.findMany({ orderBy: { startMin: "asc" }});
    const blackouts = await prisma.blackoutDate.findMany({ orderBy: { date: "asc" }});
    res.json({ settings, slots, blackouts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPSERT settings
router.put("/delivery/settings", async (req, res) => {
  const { originAddress, originLat, originLng, maxRadiusMiles, feeTiers } = req.body;
  try {
    const saved = await prisma.deliverySettings.upsert({
      where: { id: 1 },
      update: { originAddress, originLat, originLng, maxRadiusMiles, feeTiers },
      create: { id: 1, originAddress, originLat, originLng, maxRadiusMiles, feeTiers },
    });
    res.json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Replace slot templates in one shot (simple & atomic)
router.put("/delivery/slots", async (req, res) => {
  const { slots } = req.body; // [{label, startMin, endMin, capacity, active}, ...]
  try {
    await prisma.$transaction([
      prisma.slotTemplate.deleteMany({}),
      prisma.slotTemplate.createMany({ data: slots }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Set blackout dates
router.put("/delivery/blackouts", async (req, res) => {
  const { blackouts } = req.body; // [{date: 'YYYY-MM-DD', reason?}, ...]
  try {
    await prisma.$transaction([
      prisma.blackoutDate.deleteMany({}),
      prisma.blackoutDate.createMany({
        data: blackouts.map(b => ({ date: new Date(b.date), reason: b.reason || null })),
      }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
