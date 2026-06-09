"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";

type ProductDescriptionDrawerProps = {
  html: string;
  collapsedHeight?: number;
};

const ProductDescriptionDrawer = ({
  html,
  collapsedHeight = 168,
}: ProductDescriptionDrawerProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentHeight, setContentHeight] = useState(collapsedHeight);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateMeasurements = () => {
      const nextHeight = content.scrollHeight;
      setContentHeight(nextHeight);
      setIsOverflowing(nextHeight > collapsedHeight + 8);
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    };
  }, [collapsedHeight, html]);

  if (!html) {
    return null;
  }

  const visibleHeight = isExpanded || !isOverflowing ? contentHeight : collapsedHeight;

  return (
    <div className="max-w-3xl">
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-out"
        style={{ maxHeight: `${visibleHeight}px` }}
      >
        <div
          ref={contentRef}
          className="rich-text-content text-base leading-7 text-[var(--site-muted)] sm:text-lg"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {isOverflowing && !isExpanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,var(--site-panel))]" />
        ) : null}
      </div>

      {isOverflowing ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-black uppercase text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
          <FaChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : null}
    </div>
  );
};

export default ProductDescriptionDrawer;
