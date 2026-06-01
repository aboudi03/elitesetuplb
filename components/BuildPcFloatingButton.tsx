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
      className="group fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-3 rounded-l-2xl rounded-r-md border border-[var(--site-border)] bg-[var(--site-panel)]/92 px-4 py-4 text-[var(--site-text)] shadow-[0_16px_48px_rgba(0,0,0,0.14)] backdrop-blur transition duration-300 ease-out hover:-translate-y-1/2 hover:scale-[1.08] hover:border-[var(--site-accent)] hover:shadow-[0_24px_68px_rgba(0,0,0,0.22)] md:flex"
      aria-label="Build a PC online"
    >
      <span className="absolute inset-0 rounded-l-2xl rounded-r-md bg-[radial-gradient(circle_at_center,var(--site-accent-soft),transparent_72%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--site-accent)] text-white transition duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
        <HiOutlineCpuChip className="h-6 w-6" />
      </span>
      <span className="relative max-w-[120px] text-sm font-black uppercase leading-tight transition duration-300 group-hover:translate-x-0.5">
        Build a PC Online
      </span>
    </Link>
  );
};

export default BuildPcFloatingButton;
