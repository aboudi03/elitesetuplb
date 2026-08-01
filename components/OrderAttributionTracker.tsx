"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureOrderAttribution } from "@/lib/orderAttribution";

export default function OrderAttributionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureOrderAttribution();
  }, [pathname]);

  return null;
}
