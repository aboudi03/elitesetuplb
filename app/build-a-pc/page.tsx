import type { Metadata } from "next";
import PcBuilderExperience from "@/components/PcBuilderExperience";
import { absoluteUrl, STORE_NAME } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build a PC Online in Lebanon",
  description:
    "Build a custom gaming PC or setup online with Elite Setup. Compare parts, performance needs, and budget-friendly options in Lebanon.",
  alternates: {
    canonical: absoluteUrl("/build-a-pc"),
  },
  openGraph: {
    title: "Build a PC Online in Lebanon",
    description:
      "Build a custom gaming PC or setup online with Elite Setup. Compare parts, performance needs, and budget-friendly options in Lebanon.",
    url: absoluteUrl("/build-a-pc"),
    siteName: STORE_NAME,
    type: "website",
  },
};

export default function BuildAPcPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--site-bg)]">
      <div className="pointer-events-none select-none blur-[10px] opacity-35 saturate-75">
        <PcBuilderExperience />
      </div>

      <div className="absolute inset-0 z-10 flex items-start justify-center px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:items-center lg:px-8 lg:py-10">
        <div className="w-full max-w-3xl rounded-[2rem] border border-[var(--site-border)] bg-[color-mix(in_srgb,var(--site-panel)_88%,transparent)] p-6 shadow-[0_26px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--site-panel)_90%,white_10%),color-mix(in_srgb,var(--site-panel-soft)_92%,transparent)_70%)] p-5">
              <Image
                src="/Lunar-Cougar-FV150-Mini-White-Hero-Shot.webp"
                alt="Build a PC coming soon preview"
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-contain p-6"
                priority
              />
            </div>

            <div className="text-center lg:text-left">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--site-accent)]">
                Coming soon
              </p>
              <h1 className="mt-3 text-4xl font-black uppercase leading-tight text-[var(--site-text)] sm:text-5xl">
                Build a PC Online
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--site-muted)]">
                We are still preparing the full PC builder experience. This page is temporarily
                unavailable while we finish the setup and pricing flow.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--site-accent)] px-6 text-sm font-black uppercase text-white transition hover:bg-[var(--site-accent-strong)]"
              >
                Go to main page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
