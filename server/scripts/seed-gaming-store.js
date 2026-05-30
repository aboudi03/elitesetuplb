const prisma = require("../utills/db");

const categoryNames = [
  "gaming-mice",
  "gaming-keyboards",
  "gaming-headsets",
  "mousepads",
  "controllers",
  "gaming-monitors",
  "gaming-laptops",
  "gaming-pcs",
  "pc-components",
  "graphics-cards",
  "processors",
  "motherboards",
  "memory-ram",
  "storage-ssd",
  "power-supplies",
  "pc-cases",
  "cooling",
  "streaming-gear",
  "webcams",
  "microphones",
  "speakers",
  "chairs",
  "desks",
  "cables-adapters",
  "console-accessories",
  "vr-accessories",
];

const products = [
  {
    title: "ForgeStrike Pro Wireless Mouse",
    slug: "forgestrike-pro-wireless-mouse",
    price: 79,
    rating: 5,
    manufacturer: "GearForge",
    category: "gaming-mice",
    mainImage: "mouse 1.png",
    inStock: 34,
    description:
      "Lightweight wireless gaming mouse with adjustable DPI, low-latency connection, side buttons, and USB-C charging.",
  },
  {
    title: "RiftCore RGB Mechanical Keyboard",
    slug: "riftcore-rgb-mechanical-keyboard",
    price: 119,
    rating: 5,
    manufacturer: "GearForge",
    category: "gaming-keyboards",
    mainImage: "laptop 3.png",
    inStock: 22,
    description:
      "Hot-swappable mechanical keyboard with per-key RGB, compact layout, detachable cable, and gaming mode.",
  },
  {
    title: "PulseWave 7.1 Gaming Headset",
    slug: "pulsewave-71-gaming-headset",
    price: 89,
    rating: 4,
    manufacturer: "HyperSound",
    category: "gaming-headsets",
    mainImage: "headphones 1.png",
    inStock: 45,
    description:
      "Comfortable wired gaming headset with virtual surround sound, noise-reducing microphone, and memory foam ear pads.",
  },
  {
    title: "GlideMax XL Speed Mousepad",
    slug: "glidemax-xl-speed-mousepad",
    price: 24,
    rating: 4,
    manufacturer: "GearForge",
    category: "mousepads",
    mainImage: "mouse 2 1.png",
    inStock: 80,
    description:
      "Large cloth mousepad with stitched edges, rubber base, and smooth surface for fast flicks and precise tracking.",
  },
  {
    title: "ArenaPad Wireless Controller",
    slug: "arenapad-wireless-controller",
    price: 64,
    rating: 4,
    manufacturer: "NexusPlay",
    category: "controllers",
    mainImage: "mouse 3 1.png",
    inStock: 28,
    description:
      "Wireless controller for PC and console play with textured grips, responsive triggers, and long battery life.",
  },
  {
    title: "Eclipse 27 Inch 165Hz Gaming Monitor",
    slug: "eclipse-27-inch-165hz-gaming-monitor",
    price: 249,
    rating: 5,
    manufacturer: "ViewForge",
    category: "gaming-monitors",
    mainImage: "pc 1.png",
    inStock: 13,
    description:
      "Fast 27 inch gaming monitor with 165Hz refresh rate, low response time, adaptive sync, and slim bezels.",
  },
  {
    title: "NovaBlade 15 Gaming Laptop",
    slug: "novablade-15-gaming-laptop",
    price: 1299,
    rating: 5,
    manufacturer: "ApexByte",
    category: "gaming-laptops",
    mainImage: "laptop 1.webp",
    inStock: 9,
    description:
      "Portable gaming laptop with high-refresh display, dedicated graphics, RGB keyboard, and fast NVMe storage.",
  },
  {
    title: "ForgeTower RTX Gaming PC",
    slug: "forgetower-rtx-gaming-pc",
    price: 1599,
    rating: 5,
    manufacturer: "GearForge",
    category: "gaming-pcs",
    mainImage: "pc 2.png",
    inStock: 6,
    description:
      "Prebuilt gaming desktop with modern RTX graphics, strong airflow case, 32GB memory, and 1TB SSD.",
  },
  {
    title: "TitanX 4070 Graphics Card",
    slug: "titanx-4070-graphics-card",
    price: 649,
    rating: 5,
    manufacturer: "RenderMax",
    category: "graphics-cards",
    mainImage: "pc 3.png",
    inStock: 11,
    description:
      "Performance graphics card for high-FPS gaming, streaming, ray tracing, and content creation workloads.",
  },
  {
    title: "Ryzen Core 8 Gaming Processor",
    slug: "ryzen-core-8-gaming-processor",
    price: 319,
    rating: 4,
    manufacturer: "CoreForge",
    category: "processors",
    mainImage: "camera 1.png",
    inStock: 18,
    description:
      "Eight-core desktop processor tuned for gaming, multitasking, and smooth creator workflows.",
  },
  {
    title: "StrikeBoard B650 Motherboard",
    slug: "strikeboard-b650-motherboard",
    price: 189,
    rating: 4,
    manufacturer: "VoltEdge",
    category: "motherboards",
    mainImage: "camera 2.png",
    inStock: 17,
    description:
      "ATX gaming motherboard with PCIe expansion, fast networking, multiple M.2 slots, and clean RGB headers.",
  },
  {
    title: "FuryDDR 32GB RGB Memory Kit",
    slug: "furyddr-32gb-rgb-memory-kit",
    price: 109,
    rating: 5,
    manufacturer: "MemForge",
    category: "memory-ram",
    mainImage: "tablet 1 1.png",
    inStock: 32,
    description:
      "32GB dual-channel RGB memory kit for gaming PCs, streaming rigs, and heavy multitasking.",
  },
  {
    title: "FlashVault 1TB NVMe SSD",
    slug: "flashvault-1tb-nvme-ssd",
    price: 84,
    rating: 5,
    manufacturer: "DataForge",
    category: "storage-ssd",
    mainImage: "tablet 2 1.png",
    inStock: 41,
    description:
      "Fast 1TB NVMe SSD for quick game loading, responsive Windows startup, and large game libraries.",
  },
  {
    title: "VoltGuard 750W Gold PSU",
    slug: "voltguard-750w-gold-psu",
    price: 99,
    rating: 4,
    manufacturer: "VoltGuard",
    category: "power-supplies",
    mainImage: "printer 1.png",
    inStock: 20,
    description:
      "Efficient 750W modular power supply with quiet fan curve and headroom for modern gaming builds.",
  },
  {
    title: "AirForge Mesh Gaming Case",
    slug: "airforge-mesh-gaming-case",
    price: 94,
    rating: 4,
    manufacturer: "GearForge",
    category: "pc-cases",
    mainImage: "printer 2.png",
    inStock: 16,
    description:
      "Mid-tower mesh case with tempered glass side panel, strong airflow, and clean cable management space.",
  },
  {
    title: "FrostLoop 240 AIO Cooler",
    slug: "frostloop-240-aio-cooler",
    price: 129,
    rating: 4,
    manufacturer: "CoolForge",
    category: "cooling",
    mainImage: "printer 3.png",
    inStock: 15,
    description:
      "240mm liquid CPU cooler with quiet fans, strong thermal performance, and subtle RGB lighting.",
  },
  {
    title: "StreamCam 1080p Creator Webcam",
    slug: "streamcam-1080p-creator-webcam",
    price: 59,
    rating: 4,
    manufacturer: "StreamForge",
    category: "webcams",
    mainImage: "camera 3.png",
    inStock: 26,
    description:
      "1080p webcam for streaming, meetings, and content creation with autofocus and low-light correction.",
  },
  {
    title: "CastMic USB Streaming Microphone",
    slug: "castmic-usb-streaming-microphone",
    price: 74,
    rating: 5,
    manufacturer: "StreamForge",
    category: "microphones",
    mainImage: "earbuds 1.png",
    inStock: 23,
    description:
      "USB condenser microphone with desktop stand, mute control, and clear voice capture for streaming.",
  },
];

async function ensureMerchant() {
  const existing = await prisma.merchant.findFirst({
    where: { name: "GearForge Demo Supplier" },
  });

  if (existing) return existing;

  return prisma.merchant.create({
    data: {
      name: "GearForge Demo Supplier",
      description: "Sample supplier for gaming and PC peripherals.",
      email: "supplier@gearforge.local",
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
