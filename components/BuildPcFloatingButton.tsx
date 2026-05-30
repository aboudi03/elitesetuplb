"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineCpuChip } from "react-icons/hi2";

const BuildPcFloatingButton = () => {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return (
    <Link
      href="/build-a-pc"
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-3 rounded-l-2xl rounded-r-md border border-[var(--site-border)] bg-[var(--site-panel)]/95 px-4 py-4 text-[var(--site-text)] shadow-[0_16px_48px_rgba(0,0,0,0.14)] backdrop-blur md:flex"
      aria-label="Build a PC online"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--site-accent)] text-white">
        <HiOutlineCpuChip className="h-6 w-6" />
      </span>
      <span className="max-w-[120px] text-sm font-black uppercase leading-tight">
        Build a PC Online
      </span>
    </Link>
  );
};

export default BuildPcFloatingButton;
