const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: { menuItem: true }, // 👈 include the linked MenuItem so we can see names
        },
        deliveryGroups: {
          include: { items: { include: { menuItem: true } } },
        },
        addOns: true,
      },
    });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add after the GET /orders in the same file

// PATCH /api/admin/orders/:id  { status: "confirmed" | "preparing" | "out_for_delivery" | "completed" | "pending" }
router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const allowed = new Set([
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "completed",
  ]);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
