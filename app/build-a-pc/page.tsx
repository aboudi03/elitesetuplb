import type { Metadata } from "next";
import PcBuilderExperience from "@/components/PcBuilderExperience";
import { absoluteUrl, STORE_NAME } from "@/lib/seo";

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
  return <PcBuilderExperience />;
}
