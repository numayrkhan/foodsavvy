const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const Stripe = require("stripe");
const path = require("path");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const { sendOrderConfirmation } = require("./mailer");

// Serve /uploads as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//admin routes
const authenticateAdminToken = require("./auth/middleware");
const adminOrdersRoute = require("./routes/admin/orders");
const adminLoginRoute = require("./routes/admin/login");
const adminRefundRoute = require("./routes/admin/refund");
const adminMenus = require("./routes/admin/menus");
const uploadsRoute = require("./routes/admin/uploads");
const adminDelivery = require("./routes/admin/delivery");
const publicDelivery = require("./routes/admin/delivery");

app.use(cors());

// Convert a local calendar date (YYYY-MM-DD) into a Date at 12:00:00 UTC.
// Storing at noon UTC prevents it from rendering as the previous day
// in US time zones when you later do new Date(value).toLocaleDateString().
function dateKeyToUTCNoon(dateKey) {
  if (!dateKey) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

// Use express.raw to get the raw payload (important for signature verification)
// server/index.js (webhook: final version for Option B)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const metadata = pi.metadata || {};

        try {
          // 0) Handle Stripe retries/idempotency:
          //    If an order for this PaymentIntent already exists, send email only if it wasn't sent before.
          const existing = await prisma.order.findFirst({
            where: { stripePaymentIntentId: pi.id },
            select: { id: true, emailSentAt: true },
          });

          if (existing) {
            if (!existing.emailSentAt) {
              try {
                const order = await prisma.order.findUnique({
                  where: { id: existing.id },
                  include: {
                    orderItems: { include: { menuItem: true } },
                    addOns: true,
                  },
                });
                await sendOrderConfirmation(order);
                await prisma.order.update({
                  where: { id: order.id },
                  data: { emailSentAt: new Date() },
                });
                console.log(
                  "✅ Confirmation email sent (retry path):",
                  order.id
                );
              } catch (mailErr) {
                console.error("Email send failed (retry path):", mailErr);
              }
            } else {
              console.log("ℹ️ Order + email already handled for PI:", pi.id);
            }
            return res.sendStatus(200);
          }

          // 1) Parse cart metadata safely
          const menuItems = JSON.parse(metadata.menuItems || "[]");
          const addOns = JSON.parse(metadata.addOns || "[]");

          // 2) Prefer definitive billing details from latest charge (falls back to metadata)
          const charge = Array.isArray(pi.charges?.data)
            ? pi.charges.data[0]
            : null;
          const billingEmail =
            charge?.billing_details?.email ||
            pi.receipt_email ||
            metadata.email ||
            null;
          const billingName =
            charge?.billing_details?.name || metadata.name || null;

          // 3) Create order
          const created = await prisma.order.create({
            data: {
              deliveryDate: metadata.deliveryDate
                ? dateKeyToUTCNoon(metadata.deliveryDate) // metadata is "YYYY-MM-DD"
                : null,
              deliverySlot: metadata.deliverySlot || null,
              fulfillment: metadata.type || "delivery",
              status: "confirmed",
              totalCents: pi.amount,
              address: metadata.address || null,
              phone: metadata.phone || null,
              customerEmail: billingEmail,
              customerName: billingName,
              stripePaymentIntentId: pi.id,

              orderItems: {
                create: menuItems.map((item) => ({
                  menuItemId: parseInt(item.menuItemId, 10),
                  quantity: parseInt(item.quantity, 10),
                  priceCents: parseInt(item.priceCents, 10),
                })),
              },

              addOns: {
                create: addOns.map((addon) => ({
                  name: addon.name,
                  quantity: parseInt(addon.quantity, 10),
                  priceCents: parseInt(addon.priceCents, 10),
                })),
              },
            },
          });

          // 4) Re-fetch with relations for email template
          const order = await prisma.order.findUnique({
            where: { id: created.id },
            include: {
              orderItems: { include: { menuItem: true } },
              addOns: true,
            },
          });

          // 5) Send branded confirmation email (don’t fail webhook on email errors)
          try {
            await sendOrderConfirmation(order); // React → HTML via @react-email/render, sent with Resend { html }
            await prisma.order.update({
              where: { id: order.id },
              data: { emailSentAt: new Date() },
            });
            console.log("✅ Confirmation email sent:", order.id);
          } catch (mailErr) {
            console.error("Email send failed:", mailErr);
          }

          console.log("✅ Order created:", pi.id);
          return res.sendStatus(200);
        } catch (err) {
          console.error("Order creation failed:", err);
          if (!res.headersSent)
            return res.status(500).send("Order creation failed");
          break;
        }
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        console.warn(
          "❌ Payment failed:",
          pi.id,
          pi.last_payment_error?.message
        );
        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    res.json({ received: true });
  }
);

app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.send("Food Savvy API is running!");
});

// New: Get suggestions for an item (for cart upsells)
app.get("/api/suggestions", async (req, res) => {
  try {
    const { itemId } = req.query;

    const suggestions = await prisma.menuItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        menuItemAddOns: {
          include: {
            addOn: true,
          },
        },
      },
    });

    const addOns =
      suggestions?.menuItemAddOns.map((relation) => relation.addOn) || [];

    res.json(addOns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new Catering Order with automatic user creation and validation
app.post("/api/catering/orders", async (req, res) => {
  try {
    const { user, eventDate, guestCount, specialRequests, items } = req.body;

    // Basic validation
    if (
      !user ||
      !user.email ||
      !eventDate ||
      guestCount <= 0 ||
      items.length === 0
    ) {
      return res.status(400).json({ error: "Invalid data provided." });
    }

    // Check for existing user or create a new guest user
    let existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          isGuest: true,
        },
      });
    }

    // Create the catering order with associated items
    const cateringOrder = await prisma.cateringOrder.create({
      data: {
        userId: existingUser.id,
        eventDate: new Date(eventDate),
        guestCount,
        specialRequests,
        status: "pending",
        totalCents: items.reduce(
          (acc, item) => acc + item.quantity * item.priceCents,
          0
        ),
        items: {
          create: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
        },
      },
      include: { items: true, user: true },
    });

    res.status(201).json(cateringOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Catering Orders (for Admin)
app.get("/api/catering/orders", async (req, res) => {
  try {
    const orders = await prisma.cateringOrder.findMany({
      include: { items: true, user: true },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Catering Order by ID
app.get("/api/catering/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.cateringOrder.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Returns an array of reserved time‐slot strings for the given delivery date.
 */
app.get("/api/availability", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Missing `date`" });

    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [settings, templates, blackouts, orders] = await Promise.all([
      prisma.deliverySettings.findUnique({ where: { id: 1 } }),
      prisma.slotTemplate.findMany({
        where: { active: true },
        orderBy: { startMin: "asc" },
      }),
      prisma.blackoutDate.findUnique({ where: { date: dayStart } }),
      prisma.order.findMany({
        where: { deliveryDate: { gte: dayStart, lt: dayEnd } },
        select: { deliverySlot: true },
      }),
    ]);

    if (!settings)
      return res
        .status(500)
        .json({ error: "Delivery settings not configured" });
    if (blackouts) return res.json({ date, slots: [] }); // fully blocked

    const reservedCounts = orders
      .map((o) => o.deliverySlot)
      .filter(Boolean)
      .reduce((acc, s) => ((acc[s] = (acc[s] || 0) + 1), acc), {});

    const slots = templates.map((t) => {
      const reserved = reservedCounts[t.label] || 0;
      const remaining = Math.max(0, t.capacity - reserved);
      return {
        label: t.label,
        capacity: t.capacity,
        reserved,
        remaining,
        active: t.active,
      };
    });

    res.json({ date, slots });
  } catch (e) {
    console.error("Availability lookup failed:", e);
    res.status(500).json({ error: e.message });
  }
});

app.use("/api", publicDelivery);

// POST /api/create-payment-intent
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const {
      amount, // in cents
      name,
      email,
      type, // 'delivery' or 'pickup'
      metadata = {},
    } = req.body;

    if (!amount || !name || !email || !type) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      receipt_email: email,
      metadata: {
        type,
        name,
        email,
        ...metadata, // e.g. deliveryDate, deliverySlot, address, phone
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Error creating PaymentIntent:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET order by Stripe PaymentIntent id
app.get("/api/orders/by-intent/:piId", async (req, res) => {
  try {
    const { piId } = req.params;
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: piId },
      include: {
        orderItems: { include: { menuItem: true } },
        addOns: true,
      },
    });
    if (!order) {
      return res.status(404).json({ status: "pending" });
    }
    res.json(order);
  } catch (err) {
    console.error("Lookup failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

function startOfWeek(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  // Monday-based week: 0=Sun -> 6, 1=Mon -> 0, etc.
  const diff = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return dt;
}

// PUBLIC: /api/menus/by-day?weekday=0..6[&date=YYYY-MM-DD]
app.get("/api/menus/by-day", async (req, res, next) => {
  try {
    const weekday = Number(req.query.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: "Invalid weekday (0–6)" });
    }

    // Always use the single weekday menu; ignore weekOf/template
    const menu = await prisma.menu.findFirst({
      where: { serviceDay: weekday, isActive: true },
      include: {
        items: {
          where: { archived: false },
          orderBy: { id: "asc" },
          include: {
            variants: { orderBy: { priceCents: "asc" } },
            menuItemAddOns: { include: { addOn: true } },
            category: true,
          },
        },
      },
    });

    // --- A) CAPACITY: compute "remaining" per item when a concrete scheduled date was provided ---
    let remainingByItem = new Map();
    if (req.query.date) {
      const scheduledISO = new Date(req.query.date).toISOString().slice(0, 10);
      const rows = await prisma.orderItem.groupBy({
        by: ["menuItemId"],
        _sum: { quantity: true },
        where: { deliveryGroup: { serviceDate: new Date(scheduledISO) } },
      });
      for (const r of rows) remainingByItem.set(r.menuItemId, r._sum.quantity || 0);
    }

    // --- B) Reshape items: filter to priceable, flatten addOns, attach "remaining" ---
    const items = (menu?.items || [])
      .filter(
        (it) =>
          Array.isArray(it.variants) &&
          it.variants.some((v) => v.priceCents > 0)
      )
      .map(({ menuItemAddOns, ...rest }) => {
        let remaining = null;
        if (typeof rest.capacityPerDay === "number") {
          const used = remainingByItem.get(rest.id) || 0;
          remaining = Math.max(rest.capacityPerDay - used, 0);
        }
        return {
          ...rest, // keeps capacityPerDay on the wire
          addOns: (menuItemAddOns || []).map((r) => r.addOn),
          remaining,
        };
      });

    res.json({ items, meta: { weekday } });
  } catch (err) {
    next(err);
  }
});

//admin routes

app.use("/api/admin", adminLoginRoute); // unprotected login
app.use("/api/admin", authenticateAdminToken, adminOrdersRoute); // protected
app.use("/api/admin", authenticateAdminToken, adminRefundRoute); // protected
app.use("/api/admin", authenticateAdminToken, adminMenus); // protected
app.use("/api/admin/uploads", authenticateAdminToken, uploadsRoute); // protected
app.use("/api/admin", authenticateAdminToken, adminDelivery); // protected

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
