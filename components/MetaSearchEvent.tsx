"use client";

import { useEffect, useRef } from "react";
import { trackSearchEvent } from "@/lib/analytics";

export default function MetaSearchEvent({
  searchString,
}: {
  searchString: string;
}) {
  const trackedSearchString = useRef<string | null>(null);

  useEffect(() => {
    const normalizedSearchString = searchString.trim();

    if (
      !normalizedSearchString ||
      trackedSearchString.current === normalizedSearchString
    ) {
      return;
    }

    trackSearchEvent(normalizedSearchString);
    trackedSearchString.current = normalizedSearchString;
  }, [searchString]);

  return null;
}
