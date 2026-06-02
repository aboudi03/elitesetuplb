"use client";

import Image from "next/image";
import React from "react";

type HoverImagePreviewProps = {
  src: string;
  alt: string;
  thumbnailClassName?: string;
  previewClassName?: string;
};

const HoverImagePreview = ({
  src,
  alt,
  thumbnailClassName = "",
  previewClassName = "",
}: HoverImagePreviewProps) => {
  return (
    <div className="group relative">
      <div className={thumbnailClassName}>
        <Image
          width={56}
          height={56}
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
        />
      </div>

      <div
        className={`pointer-events-none absolute left-full top-1/2 z-40 ml-5 hidden -translate-y-1/2 rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)]/98 p-3 shadow-[0_28px_70px_rgba(0,0,0,0.24)] backdrop-blur group-hover:block ${previewClassName}`}
      >
        <div className="flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-xl bg-[var(--site-panel-soft)] p-4">
          <Image
            width={260}
            height={260}
            src={src}
            alt={alt}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default HoverImagePreview;
