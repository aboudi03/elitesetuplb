import Link from "next/link";
import { HiOutlineCpuChip } from "react-icons/hi2";

const BuildPcFloatingButton = () => {
  return (
    <section className="bg-[var(--site-bg)] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <Link
          href="/build-a-pc"
          className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-[1.75rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),color-mix(in_srgb,var(--site-panel-soft)_74%,white_26%))] px-6 py-5 text-[var(--site-text)] shadow-sm transition duration-300 ease-out hover:border-[var(--site-accent)] hover:shadow-[0_18px_42px_rgba(0,0,0,0.12)] max-sm:flex-col max-sm:items-start"
          aria-label="Build a PC online"
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--site-accent-soft),transparent_48%)] opacity-80" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-accent)] text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              <HiOutlineCpuChip className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase text-[var(--site-accent)]">Build smarter</p>
              <h2 className="mt-1 text-2xl font-black uppercase leading-tight max-sm:text-xl">
                Build a PC Online
              </h2>
            </div>
          </div>
          <div className="relative flex items-center gap-3 max-sm:w-full max-sm:justify-between">
            <p className="max-w-md text-sm font-medium text-[var(--site-muted)] max-sm:max-w-none">
              Pick your parts, set your budget, and send your setup request in minutes.
            </p>
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--site-accent)] px-5 text-sm font-black uppercase text-white transition group-hover:bg-[var(--site-accent-strong)]">
              Start now
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default BuildPcFloatingButton;
