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
      className="group fixed right-3 top-28 z-50 flex max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]/92 px-3 py-2 text-[var(--site-text)] shadow-[0_16px_48px_rgba(0,0,0,0.14)] backdrop-blur transition duration-300 ease-out hover:scale-[1.03] hover:border-[var(--site-accent)] hover:shadow-[0_24px_68px_rgba(0,0,0,0.22)] md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:max-w-none md:w-auto md:-translate-y-1/2 md:justify-start md:gap-3 md:rounded-l-2xl md:rounded-r-md md:px-4 md:py-4 md:hover:-translate-y-1/2 md:hover:scale-[1.08]"
      aria-label="Build a PC online"
    >
      <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,var(--site-accent-soft),transparent_72%)] opacity-0 transition duration-300 group-hover:opacity-100 md:rounded-l-2xl md:rounded-r-md" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--site-accent)] text-white transition duration-300 group-hover:scale-110 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)] md:h-11 md:w-11 md:rounded-xl">
        <HiOutlineCpuChip className="h-5 w-5 md:h-6 md:w-6" />
      </span>
      <span className="relative text-xs font-black uppercase leading-tight transition duration-300 group-hover:translate-x-0.5 md:max-w-[120px] md:text-sm">
        Build a PC Online
      </span>
    </Link>
  );
};

export default BuildPcFloatingButton;
