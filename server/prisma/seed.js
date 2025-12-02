const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting database seeding...");

  let testUser = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        isGuest: true,
        // add any other required fields here (e.g. passwordHash, role, etc.)
      },
    });
    console.log("✅ Created test user:", testUser);
  } else {
    console.log("✅ Found existing test user:", testUser);
  }

  // Clear old data
  await prisma.menuItemAddOns.deleteMany();
  await prisma.menuVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.menu.deleteMany();

  // Categories
  const categoriesData = ["Appetizers", "Entrees", "Naan Breads", "Desserts"];

  console.log("Creating categories:", categoriesData);
  const categories = {};
  for (const name of categoriesData) {
    categories[name] = await prisma.category.create({
      data: { name },
    });
  }

  // AddOns
  const addOnsData = [
    {
      name: "makhani daal",
      priceCents: 1099,
      description: "Creamy lentil dish with spices and herbs.",
      imageUrl: "./public/daal-makhni.png",
    },
    {
      name: "Garlic Naan",
      priceCents: 299,
      description: "One piece of garlic naan.",
      imageUrl: "./public/garlic-naan.png",
    },
    {
      name: "tandoori chicken",
      priceCents: 1999,
      description: "Marinated chicken cooked in a tandoor.",
      imageUrl: "./public/tandoori-chicken.png",
    },
  ];

  console.log("Creating addOns:", addOnsData);
  const addOns = {};
  for (const addOn of addOnsData) {
    const createdAddOn = await prisma.addOn.create({ data: addOn });
    console.log("Created addOn:", createdAddOn);
    addOns[addOn.name] = createdAddOn;
  }

  // Weekly Menu
  const weeklyMenu = await prisma.menu.create({
    data: {
      type: "weekly",
      releaseDate: new Date(),
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });
  console.log("Weekly menu created:", weeklyMenu);

  // Everyday Menu
  const everydayMenu = await prisma.menu.create({
    data: {
      type: "everyday",
      releaseDate: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });
  console.log("Everyday menu created:", everydayMenu);

  // MenuItems for Weekly Menu
  const weeklyMenuItemsData = [
    {
      name: "burger",
      category: "Appetizers",
      description: "Juicy grilled burger with lettuce, tomato, and cheese.",
      imageUrl: "./public/burger.png",
      variants: [{ label: "Single", priceCents: 699 }],
      addOns: [],
    },
    {
      name: "Butter Chicken",
      category: "Entrees",
      description: "Tender chicken in a creamy tomato-based sauce.",
      imageUrl: "./public/butter-chicken.png",
      variants: [
        { label: "16 oz", priceCents: 1299 },
        { label: "32 oz", priceCents: 1899 },
      ],
      addOns: ["makhani daal"],
    },
    {
      name: "biryani",
      category: "Entrees",
      description: "Fragrant basmati rice with tender chicken and spices.",
      imageUrl: "./public/biryani.png",
      variants: [
        { label: "16 oz", priceCents: 1499 },
        { label: "32 oz", priceCents: 2099 },
      ],
      addOns: ["Garlic Naan", "tandoori chicken", "makhani daal"],
    },
    {
      name: "Garlic Naan",
      category: "Naan Breads",
      description:
        "Soft leavened flatbread topped with fresh garlic and butter.",
      imageUrl: "./public/garlic-naan.png",
      variants: [{ label: "1 piece", priceCents: 299 }],
      addOns: [],
    },
    {
      name: "Gulab Jamun",
      category: "Desserts",
      description: "Sweet milk dumplings soaked in rose cardamom syrup.",
      imageUrl: "./public/gulab-jamun.png",
      variants: [{ label: "2 pcs", priceCents: 499 }],
      addOns: [],
    },
  ];

  // Helper function to create menu items
  async function createMenuItems(menu, itemsData) {
    for (const item of itemsData) {
      const menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          categoryId: categories[item.category].id,
          menuId: menu.id,
          variants: { create: item.variants },
        },
      });
      console.log("Created menuItem:", menuItem);

      for (const addOnName of item.addOns) {
        const link = await prisma.menuItemAddOns.create({
          data: {
            menuItemId: menuItem.id,
            addOnId: addOns[addOnName].id,
          },
        });
        console.log(`Linked addOn '${addOnName}' to '${item.name}':`, link);
      }
    }
  }

  await createMenuItems(weeklyMenu, weeklyMenuItemsData);

  console.log("Seeding test orders for availability endpoint…");

  // Pick a date to test (YYYY-MM-DD)
  const testDate = new Date("2025-08-10T00:00:00.000Z");

  // Create two orders with distinct slots
  await prisma.order.create({
    data: {
      userId: 1, // adjust to match an existing user
      deliveryDate: testDate,
      deliverySlot: "5:30 PM",
      // fill in any required order fields with dummy values:
      totalCents: 2000,
      fulfillment: "delivery",
      status: "pending",
    },
  });
  await prisma.order.create({
    data: {
      userId: 1,
      deliveryDate: testDate,
      deliverySlot: "6:00 PM",
      totalCents: 3500,
      fulfillment: "delivery",
      status: "pending",
    },
  });

  console.log("Test orders seeded on", testDate.toDateString());

  console.log("🌱 Database seeding completed successfully!");

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error("Error seeding:", e);
  await prisma.$disconnect();
  process.exit(1);
});
