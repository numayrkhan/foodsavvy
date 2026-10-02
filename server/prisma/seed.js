// server/prisma/seed.js (V2)
// Minimal catalog seed for Admin v2 Menu Scheduler

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { PrismaClient } = require("../generated/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Use the same adapter strategy as your server
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function upsertCategory({ name, position }) {
  return prisma.category.upsert({
    where: { name },
    update: { position },
    create: { name, position },
  });
}

async function upsertAddOn({ name, priceCents, description = null, imageUrl = null, isActive = true }) {
  const existing = await prisma.addOn.findFirst({ where: { name } });
  if (existing) {
    return prisma.addOn.update({
      where: { id: existing.id },
      data: { priceCents, description, imageUrl, isActive },
    });
  }
  return prisma.addOn.create({
    data: { name, priceCents, description, imageUrl, isActive },
  });
}

async function upsertMenuItem({ name, categoryId, description = null, imageUrl = null, isActive = true }) {
  const existing = await prisma.menuItem.findFirst({
    where: { name, categoryId, archivedAt: null },
  });

  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data: { description, imageUrl, isActive },
    });
  }

  return prisma.menuItem.create({
    data: { name, categoryId, description, imageUrl, isActive },
  });
}

async function upsertMenuVariant(menuItemId, { label, basePriceCents, baseCapacity = null, isActive = true }) {
  const existing = await prisma.menuVariant.findFirst({
    where: { menuItemId, label },
  });

  if (existing) {
    return prisma.menuVariant.update({
      where: { id: existing.id },
      data: { basePriceCents, baseCapacity, isActive },
    });
  }

  return prisma.menuVariant.create({
    data: { menuItemId, label, basePriceCents, baseCapacity, isActive },
  });
}

async function upsertMenuItemAddOn(menuItemId, addOnId, maxQtyPerItem = null) {
  // MenuItemAddOn has @@id([menuItemId, addOnId])
  return prisma.menuItemAddOn.upsert({
    where: { menuItemId_addOnId: { menuItemId, addOnId } },
    update: { maxQtyPerItem },
    create: { menuItemId, addOnId, maxQtyPerItem },
  });
}

async function upsertSlotTemplate({ label, startMin, endMin, defaultCapacity = 0, isActive = true }) {
  const existing = await prisma.slotTemplate.findFirst({ where: { label } });
  if (existing) {
    return prisma.slotTemplate.update({
      where: { id: existing.id },
      data: { startMin, endMin, defaultCapacity, isActive },
    });
  }
  return prisma.slotTemplate.create({
    data: { label, startMin, endMin, defaultCapacity, isActive },
  });
}

async function upsertDeliverySettings() {
  // DeliverySettings has id default 1, but we’ll upsert by id explicitly
  const feeTiers = [
    { toMiles: 5, feeCents: 1000 },
    { toMiles: 10, feeCents: 1500 },
    { toMiles: 15, feeCents: 2000 },
  ];

  const bundlePolicy = {
    mode: "bundle",
    bundleSize: 3,
    bundleFeeCents: 1500,
    extraBundleFeeCents: 1000,
  };

  return prisma.deliverySettings.upsert({
    where: { id: 1 },
    update: {
      originAddress: "UPDATE_ME: Kitchen Origin Address",
      feeTiers,
      bundlePolicy,
      pricingMode: "per_order_bundled",
      maxRadiusMiles: 15,
    },
    create: {
      id: 1,
      originAddress: "UPDATE_ME: Kitchen Origin Address",
      feeTiers,
      bundlePolicy,
      pricingMode: "per_order_bundled",
      maxRadiusMiles: 15,
    },
  });
}

async function main() {
  console.log("🌱 Seeding V2 catalog (Categories, Items, Variants, AddOns, Links)…");

  // 1) Categories
  const categoriesData = [
    { name: "Bowls", position: 0 },
    { name: "Curries", position: 1 },
    { name: "Sides", position: 2 },
    { name: "Desserts", position: 3 },
  ];

  const categories = {};
  for (const c of categoriesData) {
    categories[c.name] = await upsertCategory(c);
  }
  console.log("✅ Categories upserted:", Object.keys(categories));

  // 2) AddOns
  const addOnsData = [
    { name: "Extra Rice", priceCents: 200, description: "Add extra rice." },
    { name: "Extra Sauce", priceCents: 150, description: "Add extra sauce." },
    { name: "Garlic Naan", priceCents: 299, description: "One piece of garlic naan." },
    { name: "Raita", priceCents: 199, description: "Cooling yogurt sauce." },
  ];

  const addOns = {};
  for (const a of addOnsData) {
    addOns[a.name] = await upsertAddOn(a);
  }
  console.log("✅ AddOns upserted:", Object.keys(addOns));

  // 3) MenuItems + Variants + AddOnLinks
  const itemsData = [
    {
      name: "Butter Chicken",
      category: "Curries",
      description: "Tender chicken in a creamy tomato-based sauce.",
      variants: [
        { label: "Small", basePriceCents: 1299, baseCapacity: 30 },
        { label: "Large", basePriceCents: 1899, baseCapacity: 20 },
      ],
      addOns: [
        { name: "Extra Rice", maxQtyPerItem: 2 },
        { name: "Garlic Naan", maxQtyPerItem: 4 },
        { name: "Extra Sauce", maxQtyPerItem: 3 },
      ],
    },
    {
      name: "Chicken Biryani",
      category: "Bowls",
      description: "Fragrant rice with spiced chicken.",
      variants: [
        { label: "Small", basePriceCents: 1399, baseCapacity: 30 },
        { label: "Large", basePriceCents: 1999, baseCapacity: 20 },
      ],
      addOns: [
        { name: "Raita", maxQtyPerItem: 2 },
        { name: "Extra Sauce", maxQtyPerItem: 2 },
      ],
    },
    {
      name: "Paneer Tikka Bowl",
      category: "Bowls",
      description: "Grilled paneer with spices and rice.",
      variants: [
        { label: "Small", basePriceCents: 1299, baseCapacity: 30 },
        { label: "Large", basePriceCents: 1899, baseCapacity: 20 },
      ],
      addOns: [
        { name: "Extra Rice", maxQtyPerItem: 2 },
        { name: "Extra Sauce", maxQtyPerItem: 2 },
      ],
    },
    {
      name: "Daal Makhani",
      category: "Curries",
      description: "Creamy lentils slow-cooked with spices.",
      variants: [
        { label: "Small", basePriceCents: 1199, baseCapacity: 30 },
        { label: "Large", basePriceCents: 1799, baseCapacity: 20 },
      ],
      addOns: [
        { name: "Garlic Naan", maxQtyPerItem: 4 },
        { name: "Extra Rice", maxQtyPerItem: 2 },
      ],
    },
    {
      name: "Garlic Naan (Menu Item)",
      category: "Sides",
      description: "Soft flatbread topped with garlic butter.",
      variants: [{ label: "1 piece", basePriceCents: 299, baseCapacity: 100 }],
      addOns: [],
    },
    {
      name: "Gulab Jamun",
      category: "Desserts",
      description: "Sweet milk dumplings in rose syrup.",
      variants: [{ label: "2 pcs", basePriceCents: 499, baseCapacity: 50 }],
      addOns: [],
    },
  ];

  for (const item of itemsData) {
    const menuItem = await upsertMenuItem({
      name: item.name,
      categoryId: categories[item.category].id,
      description: item.description,
      imageUrl: null,
      isActive: true,
    });

    // Variants
    for (const v of item.variants) {
      await upsertMenuVariant(menuItem.id, v);
    }

    // Add-on links
    for (const link of item.addOns) {
      const addOn = addOns[link.name];
      if (addOn) {
        await upsertMenuItemAddOn(menuItem.id, addOn.id, link.maxQtyPerItem ?? null);
      }
    }
  }

  console.log("✅ MenuItems + Variants + AddOnLinks upserted.");

  // 4) Slot templates (optional but useful for later)
  await upsertSlotTemplate({ label: "5:00–6:00 PM", startMin: 17 * 60, endMin: 18 * 60, defaultCapacity: 0 });
  await upsertSlotTemplate({ label: "6:00–7:00 PM", startMin: 18 * 60, endMin: 19 * 60, defaultCapacity: 0 });
  console.log("✅ SlotTemplates upserted.");

  // 5) Delivery settings (optional but helpful later)
  await upsertDeliverySettings();
  console.log("✅ DeliverySettings upserted (id=1).");

  console.log("🌱 V2 seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
