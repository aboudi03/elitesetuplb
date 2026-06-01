const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categoryNames = [
  "gaming-mice",
  "gaming-keyboards",
  "gaming-headsets",
  "mousepads",
];

const products = [
  {
    title: "Logitech G Pro X Superlight 2",
    slug: "logitech-g-pro-x-superlight-2",
    price: 149,
    rating: 5,
    manufacturer: "Logitech",
    category: "gaming-mice",
    mainImage: "mouse 1.png",
    inStock: 18,
    description:
      "Ultra-light flagship wireless gaming mouse with HERO sensor, responsive switches, and tournament-ready shape.",
  },
  {
    title: "Logitech G Pro X TKL Lightspeed",
    slug: "logitech-g-pro-x-tkl-lightspeed",
    price: 199,
    rating: 5,
    manufacturer: "Logitech",
    category: "gaming-keyboards",
    mainImage: "pc icon.png",
    inStock: 12,
    description:
      "Wireless tenkeyless esports keyboard with LIGHTSPEED connectivity, RGB, and compact tournament layout.",
  },
  {
    title: "Logitech G Pro X 2 Lightspeed Headset",
    slug: "logitech-g-pro-x-2-lightspeed-headset",
    price: 229,
    rating: 5,
    manufacturer: "Logitech",
    category: "gaming-headsets",
    mainImage: "headphones 1.png",
    inStock: 10,
    description:
      "Premium wireless gaming headset with graphene drivers, detachable mic, and long battery life for competitive play.",
  },
  {
    title: "Logitech G640 Cloth Gaming Mousepad",
    slug: "logitech-g640-cloth-gaming-mousepad",
    price: 39,
    rating: 4,
    manufacturer: "Logitech",
    category: "mousepads",
    mainImage: "mouse 2 1.png",
    inStock: 25,
    description:
      "Medium-friction cloth surface with stable rubber base, tuned for consistent mouse control and tracking.",
  },
  {
    title: "HyperX Pulsefire Haste 2 Wireless",
    slug: "hyperx-pulsefire-haste-2-wireless",
    price: 119,
    rating: 5,
    manufacturer: "HyperX",
    category: "gaming-mice",
    mainImage: "mouse 3 1.png",
    inStock: 16,
    description:
      "Lightweight wireless gaming mouse with accurate tracking, smooth skates, and long-lasting battery life.",
  },
  {
    title: "HyperX Alloy Origins Core",
    slug: "hyperx-alloy-origins-core",
    price: 109,
    rating: 5,
    manufacturer: "HyperX",
    category: "gaming-keyboards",
    mainImage: "slider image 1.webp",
    inStock: 14,
    description:
      "Compact mechanical keyboard with sturdy aluminum body, HyperX switches, and bright per-key RGB lighting.",
  },
  {
    title: "HyperX Cloud III Wireless",
    slug: "hyperx-cloud-iii-wireless",
    price: 169,
    rating: 5,
    manufacturer: "HyperX",
    category: "gaming-headsets",
    mainImage: "headphones 2.png",
    inStock: 11,
    description:
      "Comfort-focused wireless gaming headset with clear microphone, immersive audio, and all-day battery life.",
  },
  {
    title: "HyperX Pulsefire Mat RGB",
    slug: "hyperx-pulsefire-mat-rgb",
    price: 49,
    rating: 4,
    manufacturer: "HyperX",
    category: "mousepads",
    mainImage: "mouse 2.png",
    inStock: 20,
    description:
      "Extended RGB mousepad with smooth cloth surface, stitched edges, and stable base for large gaming setups.",
  },
];

async function ensureMerchant() {
  const existing = await prisma.merchant.findFirst({
    where: { name: "Peripheral Test Supplier" },
  });

  if (existing) return existing;

  return prisma.merchant.create({
    data: {
      name: "Peripheral Test Supplier",
      description: "Sample supplier for Logitech and HyperX gaming peripherals.",
      email: "supplier@test.gearforge.local",
      phone: "+961 00 000 000",
      address: "Demo warehouse",
      status: "ACTIVE",
    },
  });
}

async function seedGamingStore() {
  console.log("Seeding gaming categories and test products...");

  const merchant = await ensureMerchant();
  const categoriesByName = new Map();

  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoriesByName.set(name, category);
  }

  let createdOrUpdated = 0;

  for (const product of products) {
    const category = categoriesByName.get(product.category);

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        price: product.price,
        rating: product.rating,
        description: product.description,
        manufacturer: product.manufacturer,
        mainImage: product.mainImage,
        inStock: product.inStock,
        isActive: true,
        categoryId: category.id,
        merchantId: merchant.id,
      },
      create: {
        title: product.title,
        slug: product.slug,
        price: product.price,
        rating: product.rating,
        description: product.description,
        manufacturer: product.manufacturer,
        mainImage: product.mainImage,
        inStock: product.inStock,
        isActive: true,
        categoryId: category.id,
        merchantId: merchant.id,
      },
    });

    createdOrUpdated += 1;
  }

  console.log(`Ready: ${categoryNames.length} categories and ${createdOrUpdated} products.`);
  console.log("Open the shop page or admin products page to test them.");
}

seedGamingStore()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
