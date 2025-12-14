const express = require("express");
const router = express.Router();
const prisma = require("../../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// POST /api/admin/orders/:id/refund  { amountCents?: number }
// - If amountCents omitted => refund the remaining refundable balance
router.post("/orders/:id/refund", async (req, res) => {
  const id = Number(req.params.id);
  const rawAmount = req.body?.amountCents;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        stripePaymentIntentId: true,
        totalCents: true,
        refundedCents: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (!order.stripePaymentIntentId) {
      return res.status(400).json({ error: "Order missing payment intent" });
    }

    const refundable = Math.max(0, order.totalCents - order.refundedCents);
    if (refundable <= 0) {
      return res.status(400).json({ error: "Nothing left to refund" });
    }

    let amount = Number.isFinite(rawAmount)
      ? Math.trunc(rawAmount)
      : refundable;
    if (amount <= 0) {
      return res.status(400).json({ error: "Refund amount must be > 0" });
    }
    if (amount > refundable) {
      return res
        .status(400)
        .json({ error: `Max refundable is ${refundable} cents` });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount,
    });

    // Track refunded cents on the order
    const updated = await prisma.order.update({
      where: { id },
      data: { refundedCents: { increment: amount } },
    });

    res.json({ ok: true, refund, order: updated });
  } catch (err) {
    console.error("Error creating refund:", err?.message || err);
    res.status(500).json({ error: "Failed to create refund" });
  }
});

module.exports = router;
