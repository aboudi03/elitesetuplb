export type NavbarCategoryItem = {
  id: string;
  label: string;
  href: string;
  children?: NavbarCategoryItem[];
};

export const fallbackNavbarCategories: NavbarCategoryItem[] = [
  { id: "mice", label: "Mice", href: "/shop/gaming-mice" },
  { id: "keyboards", label: "Keyboards", href: "/shop/gaming-keyboards" },
  { id: "headsets", label: "Headsets", href: "/shop/gaming-headsets" },
  { id: "monitors", label: "Monitors", href: "/shop/gaming-monitors" },
  { id: "laptops", label: "Laptops", href: "/shop/gaming-laptops" },
  { id: "pc-builds", label: "PC Builds", href: "/shop/gaming-pcs" },
  {
    id: "components",
    label: "Components",
    href: "/shop/pc-components",
    children: [
      { id: "graphics-cards", label: "Graphics Cards", href: "/shop/graphics-cards" },
      { id: "memory-ram", label: "Memory RAM", href: "/shop/memory-ram" },
      { id: "motherboards", label: "Motherboards", href: "/shop/motherboards" },
      { id: "pc-cases", label: "PC Cases", href: "/shop/pc-cases" },
      { id: "power-supplies", label: "Power Supplies", href: "/shop/power-supplies" },
      { id: "cooling", label: "Cooling", href: "/shop/cooling" },
    ],
  },
  {
    id: "streaming",
    label: "Streaming",
    href: "/shop/streaming-gear",
    children: [
      { id: "microphones", label: "Microphones", href: "/shop/microphones" },
      { id: "controllers", label: "Controllers", href: "/shop/controllers" },
    ],
  },
  { id: "deals", label: "Deals", href: "/shop" },
];
