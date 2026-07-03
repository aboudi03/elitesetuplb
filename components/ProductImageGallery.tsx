"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaAnglesLeft, FaAnglesRight, FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import ProductBannerOverlay from "./ProductBannerOverlay";

type ProductGalleryImage = {
  imageID: string;
  image: string;
};

type ProductImageGalleryProps = {
  mainImage?: string | null;
  images: ProductGalleryImage[];
  title: string;
  product?: Product;
};

const SLIDE_INTERVAL_MS = 3500;

const normalizeImagePath = (imagePath?: string | null) =>
  imagePath ? `/${imagePath.replace(/^\/+/, "")}` : "/product_placeholder.webp";

const ProductImageGallery = ({ mainImage, images, title, product }: ProductImageGalleryProps) => {
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);
  const [hoverZoomPosition, setHoverZoomPosition] = useState({ x: 50, y: 50 });
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [lightboxZoomOrigin, setLightboxZoomOrigin] = useState({ x: 50, y: 50 });
  const [previousRippleKey, setPreviousRippleKey] = useState(0);
  const [nextRippleKey, setNextRippleKey] = useState(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const hasManualSelectionRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const galleryFrameRef = useRef<HTMLDivElement | null>(null);
  const lightboxImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isLightboxOpen || hasManualSelectionRef.current) {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }

      return;
    }

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
  }, [activeIndex, isLightboxOpen, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];
  const hasMultipleSlides = slides.length > 1;

  const selectSlideManually = useCallback((nextIndex: number | ((currentIndex: number) => number)) => {
    hasManualSelectionRef.current = true;
    setActiveIndex(nextIndex);
  }, []);

  const goToPreviousSlide = useCallback(() => {
    if (!hasMultipleSlides) return;

    setIsLightboxZoomed(false);
    setPreviousRippleKey((currentKey) => currentKey + 1);
    selectSlideManually((currentIndex) => (currentIndex - 1 + slides.length) % slides.length);
  }, [hasMultipleSlides, selectSlideManually, slides.length]);

  const goToNextSlide = useCallback(() => {
    if (!hasMultipleSlides) return;

    setIsLightboxZoomed(false);
    setNextRippleKey((currentKey) => currentKey + 1);
    selectSlideManually((currentIndex) => (currentIndex + 1) % slides.length);
  }, [hasMultipleSlides, selectSlideManually, slides.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        setIsLightboxZoomed(false);
      }

      if (event.key === "ArrowLeft") {
        goToPreviousSlide();
      }

      if (event.key === "ArrowRight") {
        goToNextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, goToNextSlide, goToPreviousSlide]);

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

  const updatePositionFromClientPoint = (
    clientX: number,
    clientY: number,
    target: HTMLElement | null,
    onChange: (value: { x: number; y: number }) => void
  ) => {
    if (!target) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;

    onChange({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const handleGalleryMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    updatePositionFromClientPoint(
      event.clientX,
      event.clientY,
      galleryFrameRef.current,
      setHoverZoomPosition
    );
  };

  const toggleLightboxZoomAtPoint = (clientX: number, clientY: number) => {
    updatePositionFromClientPoint(
      clientX,
      clientY,
      lightboxImageRef.current,
      setLightboxZoomOrigin
    );
    setIsLightboxZoomed((current) => !current);
  };

  return (
    <div className="flex w-full max-w-[980px] min-w-0 gap-4 max-md:flex-col-reverse">
      <div className="flex max-h-[720px] w-24 shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1 max-md:grid max-md:max-h-none max-md:w-full max-md:grid-cols-4 max-md:overflow-visible max-md:pb-1 max-md:pr-0 max-sm:grid-cols-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`relative flex aspect-square h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[var(--site-bg)] p-2 transition max-md:h-auto max-md:w-full ${
              activeIndex === index
                ? "border-[var(--site-accent)] ring-2 ring-[var(--site-accent-soft)]"
                : "border-[var(--site-border)] hover:border-[var(--site-accent)]"
            }`}
            onClick={() => selectSlideManually(index)}
            aria-label={`Show ${slide.alt}`}
          >
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
        ref={galleryFrameRef}
        className="relative flex aspect-square min-h-[280px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[var(--site-border)] bg-[linear-gradient(180deg,#ffffff,var(--site-panel-soft))] p-4 shadow-[0_18px_46px_rgba(15,23,42,0.08)] sm:min-h-[420px] sm:rounded-[1.75rem] sm:p-6 lg:min-h-[620px] lg:p-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseEnter={() => setIsHoverZoomActive(true)}
        onMouseLeave={() => setIsHoverZoomActive(false)}
        onMouseMove={handleGalleryMouseMove}
      >
        <button
          type="button"
          onClick={() => {
            setIsLightboxZoomed(false);
            setIsLightboxOpen(true);
          }}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Open product image in full view"
        />
        {product ? (
          <ProductBannerOverlay
            product={product}
            variant="gallery"
            className="left-4 top-4 sm:left-5 sm:top-5 lg:left-6 lg:top-6"
          />
        ) : null}
        <Image
          key={activeSlide.src}
          src={activeSlide.src}
          width={560}
          height={560}
          alt={activeSlide.alt}
          priority
          className="relative z-0 h-full max-h-[680px] w-full animate-[productImageFade_450ms_ease-out] object-contain"
        />
        <div
          className={`pointer-events-none absolute inset-0 hidden rounded-md border border-white/20 bg-no-repeat shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-opacity duration-150 lg:block ${
            isHoverZoomActive ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${activeSlide.src})`,
            backgroundPosition: `${hoverZoomPosition.x}% ${hoverZoomPosition.y}%`,
            backgroundSize: "220%",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden rounded-full border border-[var(--site-border)] bg-[var(--site-panel)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--site-muted)] backdrop-blur lg:block">
          Hover to zoom
        </div>
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

            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  onClick={() => selectSlideManually(index)}
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

      {isLightboxOpen && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur-sm animate-[lightboxFadeIn_220ms_ease-out]"
          onClick={() => {
            setIsLightboxOpen(false);
            setIsLightboxZoomed(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded product image"
        >
          <div
            className="relative inline-flex max-h-[92vh] max-w-full items-start justify-center animate-[lightboxZoomIn_260ms_cubic-bezier(0.22,1,0.36,1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setIsLightboxOpen(false);
                setIsLightboxZoomed(false);
              }}
              className="absolute right-2 top-2 z-[101] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:scale-105 hover:bg-black/80 sm:right-3 sm:top-3"
              aria-label="Close enlarged image"
            >
              <FaXmark className="h-5 w-5" />
            </button>
            {hasMultipleSlides ? (
              <>
                <button
                  type="button"
                  onClick={goToPreviousSlide}
                  className="absolute left-2 top-1/2 z-[101] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:scale-105 hover:bg-black/80 sm:left-3"
                  aria-label="Previous enlarged image"
                >
                  <FaChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  className="absolute right-2 top-1/2 z-[101] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:scale-105 hover:bg-black/80 sm:right-3"
                  aria-label="Next enlarged image"
                >
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : null}
            <Image
              key={`lightbox-${activeSlide.src}-${isLightboxZoomed ? "zoomed" : "base"}`}
              ref={lightboxImageRef}
              src={activeSlide.src}
              width={1600}
              height={1600}
              alt={activeSlide.alt}
              priority
              onClick={(event) => toggleLightboxZoomAtPoint(event.clientX, event.clientY)}
              onTouchStart={(event) => {
                const touch = event.touches[0];

                if (!touch) {
                  return;
                }

                updatePositionFromClientPoint(
                  touch.clientX,
                  touch.clientY,
                  lightboxImageRef.current,
                  setLightboxZoomOrigin
                );
              }}
              onTouchMove={(event) => {
                if (!isLightboxZoomed) {
                  return;
                }

                const touch = event.touches[0];

                if (!touch) {
                  return;
                }

                updatePositionFromClientPoint(
                  touch.clientX,
                  touch.clientY,
                  lightboxImageRef.current,
                  setLightboxZoomOrigin
                );
              }}
              className={`h-auto max-h-[92vh] w-auto max-w-full rounded-md object-contain transition-transform duration-300 ease-out ${
                isLightboxZoomed ? "cursor-zoom-out scale-[1.75]" : "cursor-zoom-in scale-100"
              }`}
              style={{
                transformOrigin: `${lightboxZoomOrigin.x}% ${lightboxZoomOrigin.y}%`,
              }}
            />
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default ProductImageGallery;
