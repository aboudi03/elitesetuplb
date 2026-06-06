"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaAnglesLeft, FaAnglesRight, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

type ProductGalleryImage = {
  imageID: string;
  image: string;
};

type ProductImageGalleryProps = {
  mainImage?: string | null;
  images: ProductGalleryImage[];
  title: string;
};

const SLIDE_INTERVAL_MS = 3500;

const normalizeImagePath = (imagePath?: string | null) =>
  imagePath ? `/${imagePath.replace(/^\/+/, "")}` : "/product_placeholder.jpg";

const ProductImageGallery = ({ mainImage, images, title }: ProductImageGalleryProps) => {
  const slides = useMemo(
    () => [
      {
        id: "main-image",
        src: normalizeImagePath(mainImage),
        alt: title,
      },
      ...images.map((image, index) => ({
        id: image.imageID,
        src: normalizeImagePath(image.image),
        alt: `${title} image ${index + 1}`,
      })),
    ],
    [images, mainImage, title]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousRippleKey, setPreviousRippleKey] = useState(0);
  const [nextRippleKey, setNextRippleKey] = useState(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [activeIndex, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];
  const hasMultipleSlides = slides.length > 1;

  const goToPreviousSlide = () => {
    if (!hasMultipleSlides) return;

    setPreviousRippleKey((currentKey) => currentKey + 1);
    setActiveIndex((currentIndex) => (currentIndex - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    if (!hasMultipleSlides) return;

    setNextRippleKey((currentKey) => currentKey + 1);
    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = (event.touches[0]?.clientX ?? 0) - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 40;

    if (touchDeltaXRef.current <= -swipeThreshold) {
      goToNextSlide();
    } else if (touchDeltaXRef.current >= swipeThreshold) {
      goToPreviousSlide();
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  return (
    <div className="flex w-full max-w-2xl gap-4 max-sm:flex-col-reverse">
      <div className="flex max-h-[520px] w-24 shrink-0 flex-col gap-3 overflow-y-auto pr-1 max-sm:w-full max-sm:flex-row max-sm:overflow-x-auto max-sm:overflow-y-hidden max-sm:pr-0">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`relative flex aspect-square h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,0.96)_60%,_rgba(226,232,240,0.8)_100%)] p-2 transition ${
              activeIndex === index
                ? "border-[var(--site-accent)] ring-2 ring-[var(--site-accent-soft)]"
                : "border-[var(--site-border)] hover:border-[var(--site-accent)]"
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${slide.alt}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0))]" />
            <Image
              src={slide.src}
              width={80}
              height={80}
              alt={slide.alt}
              className="relative z-10 h-full w-full object-contain"
            />
          </button>
        ))}
      </div>

      <div
        className="relative flex aspect-square min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,0.97)_58%,_rgba(226,232,240,0.82)_100%)] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0))]" />
        <Image
          key={activeSlide.src}
          src={activeSlide.src}
          width={560}
          height={560}
          alt={activeSlide.alt}
          priority
          className="relative z-10 h-full max-h-[520px] w-full animate-[productImageFade_450ms_ease-out] object-contain"
        />
        {hasMultipleSlides ? (
          <>
            <button
              type="button"
              onClick={goToPreviousSlide}
              className="hero-edge-button hero-edge-button--previous group absolute left-0 top-1/2 z-20 -translate-y-1/2 text-[var(--site-text)]"
              aria-label="Previous product image"
            >
              <span className="hero-edge-button__bubble" aria-hidden="true" />
              <span className="hero-edge-button__shape" aria-hidden="true" />
              {previousRippleKey > 0 && (
                <>
                  <span
                    key={`product-previous-ripple-one-${previousRippleKey}`}
                    className="hero-edge-button__ripple hero-edge-button__ripple--one hero-edge-button__ripple--play"
                    aria-hidden="true"
                  />
                  <span
                    key={`product-previous-ripple-two-${previousRippleKey}`}
                    className="hero-edge-button__ripple hero-edge-button__ripple--two hero-edge-button__ripple--play"
                    aria-hidden="true"
                  />
                </>
              )}
              <span className="hero-edge-button__icon hero-edge-button__icon--base">
                <FaChevronLeft />
              </span>
              <span className="hero-edge-button__icon hero-edge-button__icon--hover" aria-hidden="true">
                <FaAnglesLeft />
              </span>
            </button>

            <button
              type="button"
              onClick={goToNextSlide}
              className="hero-edge-button hero-edge-button--next group absolute right-0 top-1/2 z-20 -translate-y-1/2 text-[var(--site-text)]"
              aria-label="Next product image"
            >
              <span className="hero-edge-button__bubble" aria-hidden="true" />
              <span className="hero-edge-button__shape" aria-hidden="true" />
              {nextRippleKey > 0 && (
                <>
                  <span
                    key={`product-next-ripple-one-${nextRippleKey}`}
                    className="hero-edge-button__ripple hero-edge-button__ripple--one hero-edge-button__ripple--play"
                    aria-hidden="true"
                  />
                  <span
                    key={`product-next-ripple-two-${nextRippleKey}`}
                    className="hero-edge-button__ripple hero-edge-button__ripple--two hero-edge-button__ripple--play"
                    aria-hidden="true"
                  />
                </>
              )}
              <span className="hero-edge-button__icon hero-edge-button__icon--base">
                <FaChevronRight />
              </span>
              <span className="hero-edge-button__icon hero-edge-button__icon--hover" aria-hidden="true">
                <FaAnglesRight />
              </span>
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeIndex === index
                      ? "w-10 bg-[var(--site-accent)]"
                      : "w-2.5 bg-[var(--site-border)]"
                  }`}
                  aria-label={`Show product image ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProductImageGallery;
