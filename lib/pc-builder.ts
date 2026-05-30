export type PcBuilderCategoryKey =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "secondaryStorage"
  | "psu"
  | "cooling"
  | "case"
  | "fans";

export type PcBuilderOption = {
  id: string;
  label: string;
  tier: "Entry" | "Mid" | "High";
  note: string;
};

export type PcBuilderCategory = {
  key: PcBuilderCategoryKey;
  label: string;
  helper: string;
  options: PcBuilderOption[];
};

export const pcBuilderWhatsAppNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "96171089840";

export const pcBuilderCatalog: PcBuilderCategory[] = [
  {
    key: "cpu",
    label: "CPU",
    helper: "Choose the processor level you want for gaming and daily work.",
    options: [
      { id: "ryzen-5-5600", label: "Ryzen 5 5600", tier: "Entry", note: "Strong value for smooth 1080p gaming." },
      { id: "ryzen-5-7500f", label: "Ryzen 5 7500F", tier: "Mid", note: "Modern AM5 value pick with strong gaming headroom." },
      { id: "ryzen-5-7600", label: "Ryzen 5 7600", tier: "Mid", note: "Fast mainstream gaming CPU with efficient power use." },
      { id: "ryzen-7-7700", label: "Ryzen 7 7700", tier: "Mid", note: "Balanced gaming and multitasking performance." },
      { id: "ryzen-7-7800x3d", label: "Ryzen 7 7800X3D", tier: "High", note: "Top-tier gaming performance for high refresh builds." },
      { id: "ryzen-9-7900", label: "Ryzen 9 7900", tier: "High", note: "Extra cores for gaming plus heavier creator workloads." },
      { id: "core-i5-13400f", label: "Core i5-13400F", tier: "Entry", note: "Solid Intel option for balanced gaming builds." },
      { id: "core-i5-14400f", label: "Core i5-14400F", tier: "Mid", note: "Reliable modern Intel option for mainstream builds." },
      { id: "core-i5-14600k", label: "Core i5-14600K", tier: "High", note: "Stronger clocks and hybrid cores for demanding users." },
      { id: "core-i7-14700f", label: "Core i7-14700F", tier: "High", note: "High-core-count Intel pick for mixed gaming and work." },
    ],
  },
  {
    key: "gpu",
    label: "GPU",
    helper: "Pick the graphics level you want the store to quote and source.",
    options: [
      { id: "rtx-4050", label: "RTX 4050", tier: "Entry", note: "Entry-level path for light esports and casual play." },
      { id: "rtx-4060", label: "RTX 4060", tier: "Entry", note: "Good for esports and efficient 1080p gaming." },
      { id: "rtx-4060-ti", label: "RTX 4060 Ti", tier: "Mid", note: "More comfortable for higher settings and heavier titles." },
      { id: "rtx-5060", label: "RTX 5060", tier: "Mid", note: "Modern mainstream option for 1080p to 1440p play." },
      { id: "rtx-5060-ti", label: "RTX 5060 Ti", tier: "Mid", note: "A stronger midrange target for smoother 1440p gaming." },
      { id: "rtx-5070", label: "RTX 5070", tier: "High", note: "High-performance choice for sharper 1440p gaming." },
      { id: "rtx-5070-ti", label: "RTX 5070 Ti", tier: "High", note: "Premium gaming tier with more overhead for demanding games." },
      { id: "rx-7700-xt", label: "RX 7700 XT", tier: "Mid", note: "Competitive value option for modern 1440p gaming." },
      { id: "rx-7800-xt", label: "RX 7800 XT", tier: "High", note: "Strong raster performance with more VRAM headroom." },
      { id: "rx-7900-gre", label: "RX 7900 GRE", tier: "High", note: "Higher-end AMD target with strong raw gaming output." },
    ],
  },
  {
    key: "motherboard",
    label: "Motherboard",
    helper: "We keep this platform-focused so the final board can match stock.",
    options: [
      { id: "a620", label: "A620", tier: "Entry", note: "Entry AM5 board for budget-focused modern Ryzen builds." },
      { id: "b550", label: "B550", tier: "Entry", note: "Mature AM4 platform with solid value." },
      { id: "b650", label: "B650", tier: "Mid", note: "Mainstream AM5 board for current Ryzen builds." },
      { id: "b650e", label: "B650E", tier: "High", note: "AM5 board with stronger connectivity and expansion." },
      { id: "x670", label: "X670", tier: "High", note: "Higher-end AM5 option for premium expansion." },
      { id: "h610", label: "H610", tier: "Entry", note: "Basic Intel platform for value-oriented builds." },
      { id: "b760", label: "B760", tier: "Mid", note: "Popular Intel platform for mainstream Core builds." },
      { id: "z790", label: "Z790", tier: "High", note: "Higher-end Intel platform for unlocked processors." },
    ],
  },
  {
    key: "ram",
    label: "RAM",
    helper: "Capacity and speed target for the build quote.",
    options: [
      { id: "16gb-ddr4", label: "16GB DDR4", tier: "Entry", note: "Affordable starting point for everyday gaming." },
      { id: "16gb-ddr5", label: "16GB DDR5", tier: "Entry", note: "Modern entry option for newer platforms." },
      { id: "32gb-ddr4", label: "32GB DDR4", tier: "Mid", note: "Extra room for streaming and heavier multitasking." },
      { id: "32gb-ddr5-5600", label: "32GB DDR5 5600", tier: "Mid", note: "Strong all-around speed target for new builds." },
      { id: "32gb-ddr5", label: "32GB DDR5", tier: "High", note: "Modern sweet spot for newer platforms." },
      { id: "48gb-ddr5", label: "48GB DDR5", tier: "High", note: "Useful middle ground for larger workloads." },
      { id: "64gb-ddr5", label: "64GB DDR5", tier: "High", note: "For power users, creation work, and long-term headroom." },
    ],
  },
  {
    key: "storage",
    label: "NVMe SSD",
    helper: "Fast storage target for OS, games, and project files.",
    options: [
      { id: "500gb-gen3", label: "500GB NVMe Gen3", tier: "Entry", note: "Budget primary drive for lighter setups." },
      { id: "1tb-gen3", label: "1TB NVMe Gen3", tier: "Entry", note: "Quick and budget-friendly for most users." },
      { id: "1tb-gen4", label: "1TB NVMe Gen4", tier: "Mid", note: "Faster game load and file transfer speeds." },
      { id: "2tb-gen3", label: "2TB NVMe Gen3", tier: "Mid", note: "Higher capacity without stepping into pricier tiers." },
      { id: "2tb-gen4", label: "2TB NVMe Gen4", tier: "High", note: "Best fit for large libraries and fewer compromises." },
      { id: "4tb-gen4", label: "4TB NVMe Gen4", tier: "High", note: "For huge game libraries and heavier production files." },
    ],
  },
  {
    key: "secondaryStorage",
    label: "Extra Storage",
    helper: "Optional secondary drive target for bigger libraries and project files.",
    options: [
      { id: "none", label: "No Extra Storage", tier: "Entry", note: "Keep the build focused on a single fast main drive." },
      { id: "1tb-sata-ssd", label: "1TB SATA SSD", tier: "Entry", note: "Extra affordable space for games and media." },
      { id: "2tb-sata-ssd", label: "2TB SATA SSD", tier: "Mid", note: "Good secondary library drive with quiet operation." },
      { id: "2tb-hdd", label: "2TB HDD", tier: "Entry", note: "Budget bulk storage for large files and backups." },
      { id: "4tb-hdd", label: "4TB HDD", tier: "Mid", note: "Higher-capacity archive and media storage." },
      { id: "2tb-nvme-gen4", label: "Extra 2TB NVMe Gen4", tier: "High", note: "Fast secondary drive for premium builds." },
    ],
  },
  {
    key: "psu",
    label: "Power Supply",
    helper: "Power target for the final quoted build.",
    options: [
      { id: "550w-bronze", label: "550W 80+ Bronze", tier: "Entry", note: "Best for efficient, lower-power builds." },
      { id: "650w-bronze", label: "650W 80+ Bronze", tier: "Entry", note: "Good value for efficient midrange systems." },
      { id: "650w-gold", label: "650W 80+ Gold", tier: "Mid", note: "Cleaner efficiency for refined mainstream builds." },
      { id: "750w-gold", label: "750W 80+ Gold", tier: "Mid", note: "Comfortable fit for stronger gaming GPUs." },
      { id: "850w-gold", label: "850W 80+ Gold", tier: "High", note: "Extra headroom for higher-end parts and future upgrades." },
      { id: "1000w-gold", label: "1000W 80+ Gold", tier: "High", note: "For top-tier GPUs, upgrades, and more expansion." },
    ],
  },
  {
    key: "cooling",
    label: "CPU Cooling",
    helper: "Cooling preference for noise, thermals, and final case fit.",
    options: [
      { id: "stock-air", label: "Standard Air Cooling", tier: "Entry", note: "Simple and cost-effective for efficient CPUs." },
      { id: "tower-air-single", label: "Tower Air Cooler", tier: "Mid", note: "A solid step up in noise and thermal performance." },
      { id: "tower-air", label: "Performance Air Cooling", tier: "Mid", note: "Quiet and dependable for stronger processors." },
      { id: "aio-240", label: "240mm Liquid Cooling", tier: "High", note: "Popular liquid option for cleaner thermals and looks." },
      { id: "aio-280", label: "280mm Liquid Cooling", tier: "High", note: "Stronger cooling target with quiet fan potential." },
      { id: "aio-360", label: "360mm Liquid Cooling", tier: "High", note: "Premium cooling look and thermal overhead." },
    ],
  },
  {
    key: "case",
    label: "Case",
    helper: "Chassis style and airflow direction for the final quote.",
    options: [
      { id: "airflow-mid", label: "Airflow Mid Tower", tier: "Entry", note: "Clean, practical, and easy to cool." },
      { id: "compact-airflow", label: "Compact Airflow Case", tier: "Entry", note: "Smaller footprint without giving up airflow focus." },
      { id: "rgb-mid", label: "RGB Gaming Mid Tower", tier: "Mid", note: "Popular gaming look with tempered glass styling." },
      { id: "minimal-premium", label: "Minimal Premium Mid Tower", tier: "Mid", note: "Cleaner aesthetic for understated setups." },
      { id: "premium-showcase", label: "Premium Showcase Case", tier: "High", note: "Higher-end finish for flagship-style builds." },
      { id: "dual-chamber", label: "Dual Chamber Showcase Case", tier: "High", note: "Spacious layout for cleaner cable management and display builds." },
    ],
  },
  {
    key: "fans",
    label: "Case Fans",
    helper: "Extra airflow target to match performance and style.",
    options: [
      { id: "included-fans", label: "Use Included Fans", tier: "Entry", note: "Keep the build simple with the case stock fan setup." },
      { id: "3-fan-airflow", label: "3 Extra Airflow Fans", tier: "Mid", note: "Good thermal improvement for gaming-focused builds." },
      { id: "3-fan-rgb", label: "3 Extra RGB Fans", tier: "Mid", note: "Adds both airflow and a cleaner lighting look." },
      { id: "6-fan-rgb", label: "6 Premium RGB Fans", tier: "High", note: "Full showcase cooling setup for stronger visuals and airflow." },
    ],
  },
];
