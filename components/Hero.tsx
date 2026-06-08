"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { FaAnglesLeft, FaAnglesRight, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import apiClient from "@/lib/api";
import {
  fallbackNavbarCategories,
  type NavbarCategoryItem,
} from "@/lib/navbarCategories";

type HeroSlide = {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  productImage: string;
  href: string;
  isActive?: boolean;
  sortOrder?: number;
  productWrapClassName?: string;
  productImageClassName?: string;
};

const fallbackSlides: HeroSlide[] = [
  {
    eyebrow: "Audio drop",
    title: "HyperX Cloud III",
    subtitle: "Comfortable wired headset with clear voice, deep game audio, and a clean black setup look.",
    image: "/hyperxbackg.png",
    productImage: "https://hyperx.com/cdn/shop/files/hyperx_cloud_iii_black_66x0048_main_1_c352faf1-cd4b-4be0-b3cb-2d49d3581ae9_1024x1024.jpg?v=1775587372",
    href: "/shop/gaming-headsets",
    productWrapClassName:
      "right-[9%] bottom-2 h-[74%] max-md:bottom-16 max-md:h-[34%] max-sm:bottom-14 max-sm:h-[30%]",
    productImageClassName:
      "max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.34)]",
  },
  {
    eyebrow: "Pro wireless mice",
    title: "Logitech G Pro Wireless",
    subtitle: "Lightweight wireless control for fast flicks, clean aim, and competitive desk setups.",
    image: "/logitechbackg.png",
    productImage: "https://s24.q4cdn.com/131595232/files/doc_multimedia/2018/08/1/Low_Resolution_JPG-PRO_Wireless_Top_BB.jpg",
    href: "/shop/gaming-mice",
    productWrapClassName:
      "right-[11%] bottom-8 h-[62%] max-md:bottom-16 max-md:h-[30%] max-sm:bottom-14 max-sm:h-[26%]",
    productImageClassName:
      "max-h-full w-auto object-contain drop-shadow-[0_26px_34px_rgba(2,12,27,0.4)]",
  },
  {
    eyebrow: "RGB keyboards",
    title: "HyperX Alloy Origins",
    subtitle: "Mechanical switches, compact aluminum build, and bright RGB for your main setup.",
    image: "/hyperxbackg2.png",
    productImage: "https://row.hyperx.com/cdn/shop/products/hyperx_alloy_origins_pbt_hx_aqua_tw_angle_2_1024x1024.jpg?v=1666376510",
    href: "/shop/gaming-keyboards",
    productWrapClassName:
      "right-[7%] bottom-5 h-[64%] max-md:bottom-16 max-md:h-[31%] max-sm:bottom-14 max-sm:h-[27%]",
    productImageClassName:
      "max-h-full w-auto object-contain drop-shadow-[0_30px_38px_rgba(0,0,0,0.38)]",
  },
];

const Hero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">("next");
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [heroCategories, setHeroCategories] = useState<NavbarCategoryItem[]>(
    fallbackNavbarCategories
  );
  const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null);
  const [previousRippleKey, setPreviousRippleKey] = useState(0);
  const [nextRippleKey, setNextRippleKey] = useState(0);
  const autoplayTimerRef = useRef<number | null>(null);
  const transitionLockRef = useRef(false);
  const transitionUnlockTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    const fetchNavbarCategories = async () => {
      try {
        const response = await fetch("/api/navbar-categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setHeroCategories(data);
        }
      } catch (error) {
        console.error("Failed to load navbar categories:", error);
      }
    };

    fetchNavbarCategories();
  }, []);

  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const response = await apiClient.get("/api/hero-slides", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setSlides(
            data.map((slide: any) => ({
              id: slide.id,
              eyebrow: slide.eyebrow,
              title: slide.title,
              subtitle: slide.subtitle,
              image: `/${slide.backgroundImage}`,
              productImage: `/${slide.productImage}`,
              href: slide.href,
              isActive: slide.isActive,
              sortOrder: slide.sortOrder,
              productWrapClassName:
                "right-[12%] bottom-4 h-[72%] max-md:bottom-16 max-md:h-[34%] max-sm:bottom-14 max-sm:h-[30%]",
              productImageClassName:
                "max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]",
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load hero slides:", error);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, slides.length]);

  useEffect(() => {
    if (
      expandedMobileCategoryId &&
      !heroCategories.some((category) => category.id === expandedMobileCategoryId)
    ) {
      setExpandedMobileCategoryId(null);
    }
  }, [expandedMobileCategoryId, heroCategories]);

  useEffect(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = window.setTimeout(() => {
      if (slides.length <= 1 || transitionLockRef.current) {
        return;
      }

      beginSlideTransition();
      setSlideDirection("next");
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [activeSlide, slides.length]);

  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }

      if (transitionUnlockTimerRef.current) {
        window.clearTimeout(transitionUnlockTimerRef.current);
      }
    };
  }, []);

  const slide = slides[activeSlide] ?? fallbackSlides[0];
  const beginSlideTransition = () => {
    transitionLockRef.current = true;

    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    if (transitionUnlockTimerRef.current) {
      window.clearTimeout(transitionUnlockTimerRef.current);
    }

    transitionUnlockTimerRef.current = window.setTimeout(() => {
      transitionLockRef.current = false;
    }, 900);
  };
  const canChangeSlide = () => slides.length > 1 && !transitionLockRef.current;

  const goToPreviousSlide = () => {
    if (!canChangeSlide()) return;

    beginSlideTransition();
    setPreviousRippleKey((current) => current + 1);
    setSlideDirection("previous");
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    if (!canChangeSlide()) return;

    beginSlideTransition();
    setNextRippleKey((current) => current + 1);
    setSlideDirection("next");
    setActiveSlide((current) => (current + 1) % slides.length);
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
    const swipeThreshold = 48;

    if (touchDeltaXRef.current <= -swipeThreshold) {
      goToNextSlide();
    } else if (touchDeltaXRef.current >= swipeThreshold) {
      goToPreviousSlide();
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategoryId((current) =>
      current === categoryId ? null : categoryId
    );
  };

  const expandedMobileCategory = heroCategories.find(
    (category) => category.id === expandedMobileCategoryId
  );

  return (
    <section className="bg-[var(--site-bg)] pb-8">
      <nav className="border-b border-[var(--site-border)] bg-[var(--site-panel)]">
        <div
          className="mx-auto flex max-w-screen-2xl items-center justify-center gap-9 overflow-x-auto px-4 py-3 text-sm font-semibold text-[var(--site-text)] max-lg:justify-start lg:overflow-visible"
          style={{
            touchAction: "pan-x",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {heroCategories.map((category) => {
            const hasChildren = Array.isArray(category.children) && category.children.length > 0;
            const isExpandedOnMobile = expandedMobileCategoryId === category.id;

            return (
              <div key={category.id} className="group relative shrink-0">
                {hasChildren ? (
                  <>
                    <Link
                      href={category.href}
                      className="hidden items-center gap-2 whitespace-nowrap transition hover:text-[var(--site-accent)] lg:inline-flex"
                    >
                      {category.label}
                      <span
                        aria-hidden="true"
                        className="text-xs leading-none transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                      >
                        <FaChevronDown />
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleMobileCategory(category.id)}
                      aria-expanded={isExpandedOnMobile}
                      className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[var(--site-accent)] lg:hidden"
                    >
                      {category.label}
                      <span
                        aria-hidden="true"
                        className={`text-xs leading-none transition-transform duration-200 ${
                          isExpandedOnMobile ? "rotate-180" : ""
                        }`}
                      >
                        <FaChevronDown />
                      </span>
                    </button>
                  </>
                ) : (
                  <Link
                    href={category.href}
                    className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-[var(--site-accent)]"
                  >
                    {category.label}
                  </Link>
                )}

                {hasChildren && (
                  <>
                    <div className="absolute left-0 top-full z-30 hidden min-w-[240px] pt-3 group-hover:block group-focus-within:block max-lg:hidden">
                      <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-panel)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
                        {category.children!.map((childCategory) => (
                          <Link
                            key={childCategory.id}
                            href={childCategory.href}
                            className="block rounded-lg px-3 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
                          >
                            {childCategory.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {expandedMobileCategory && Array.isArray(expandedMobileCategory.children) ? (
          <div className="border-t border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4 lg:hidden">
            <div className="mx-auto max-w-screen-2xl rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--site-border)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                    Subcategories
                  </p>
                  <p className="truncate text-sm font-semibold text-[var(--site-text)]">
                    {expandedMobileCategory.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedMobileCategoryId(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                  aria-label={`Close ${expandedMobileCategory.label} subcategories`}
                >
                  <FaChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-3">
                <div className="grid gap-2">
                  {expandedMobileCategory.children.map((childCategory) => (
                    <Link
                      key={childCategory.id}
                      href={childCategory.href}
                      onClick={() => setExpandedMobileCategoryId(null)}
                      className="block rounded-xl border border-transparent bg-[var(--site-panel-soft)] px-4 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    >
                      {childCategory.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mx-auto max-w-screen-2xl px-4 pt-5 sm:px-6 lg:px-8">
        <div
          className="relative min-h-[460px] overflow-hidden border border-[var(--site-border)] bg-[var(--site-panel)] max-md:min-h-[680px] max-sm:min-h-[640px]"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div
            key={`background-${activeSlide}`}
            className={`absolute inset-0 ${
              slideDirection === "next"
                ? "animate-[heroImageNext_850ms_ease-out_both]"
                : "animate-[heroImagePrevious_850ms_ease-out_both]"
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--site-panel) 0%, color-mix(in srgb, var(--site-panel) 62%, transparent) 46%, transparent 100%)",
            }}
          />

          <div
            key={`copy-${activeSlide}`}
            className={`absolute left-0 top-0 z-10 flex h-full w-[46%] min-w-[470px] flex-col justify-center rounded-r-[120px] border-r border-[var(--site-border)] bg-[var(--site-panel)] pl-16 pr-8 py-10 shadow-[18px_0_45px_rgba(0,0,0,0.12)] max-md:left-4 max-md:top-4 max-md:h-auto max-md:w-[calc(100%-2rem)] max-md:min-w-0 max-md:rounded-md max-md:border max-md:px-5 max-md:py-6 max-md:shadow-xl max-sm:px-4 max-sm:py-5 ${
              slideDirection === "next"
                ? "animate-[heroCopyNext_700ms_ease-out_both]"
                : "animate-[heroCopyPrevious_700ms_ease-out_both]"
            }`}
          >
            <p className="text-base font-black uppercase tracking-wide text-[var(--site-accent)] max-sm:text-sm">
              {slide.eyebrow}
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-black uppercase leading-tight text-[var(--site-text)] max-lg:text-4xl max-md:mt-3 max-sm:text-2xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-[var(--site-muted)] max-md:mt-3 max-sm:text-sm max-sm:leading-6">
              {slide.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 max-md:mt-5 max-sm:grid max-sm:grid-cols-1">
              <Link
                href={slide.href}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--site-accent)] px-8 text-base font-black uppercase text-white shadow transition hover:bg-[var(--site-accent-strong)] max-sm:px-5 max-sm:text-sm"
              >
                Shop now
              </Link>
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-8 text-base font-black uppercase text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] max-sm:px-5 max-sm:text-sm"
              >
                All products
              </Link>
            </div>
          </div>

          <div
            key={`product-${activeSlide}`}
            className={`absolute z-10 flex items-end max-md:left-0 max-md:right-0 max-md:justify-center ${
              slide.productWrapClassName ||
              "right-[12%] bottom-4 h-[72%] max-md:bottom-16 max-md:h-[34%] max-sm:bottom-14 max-sm:h-[30%]"
            } ${
              slideDirection === "next"
                ? "animate-[heroProductNext_850ms_cubic-bezier(0.22,1,0.36,1)_both]"
                : "animate-[heroProductPrevious_850ms_cubic-bezier(0.22,1,0.36,1)_both]"
            }`}
          >
            <Image
              src={slide.productImage}
              width={520}
              height={520}
              alt={slide.title}
              priority
              className={
                slide.productImageClassName ||
                "max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]"
              }
            />
          </div>

          <button
            type="button"
            onClick={goToPreviousSlide}
            className="hero-edge-button hero-edge-button--previous group absolute left-0 top-1/2 z-20 -translate-y-1/2 text-[var(--site-text)] max-md:bottom-4 max-md:left-4 max-md:translate-y-0 max-sm:left-3"
            aria-label="Previous promotion"
          >
            <span className="hero-edge-button__bubble" aria-hidden="true" />
            <span className="hero-edge-button__shape" aria-hidden="true" />
            {previousRippleKey > 0 && (
              <>
                <span
                  key={`previous-ripple-one-${previousRippleKey}`}
                  className="hero-edge-button__ripple hero-edge-button__ripple--one hero-edge-button__ripple--play"
                  aria-hidden="true"
                />
                <span
                  key={`previous-ripple-two-${previousRippleKey}`}
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
            className="hero-edge-button hero-edge-button--next group absolute right-0 top-1/2 z-20 -translate-y-1/2 text-[var(--site-text)] max-md:bottom-4 max-md:right-4 max-md:translate-y-0 max-sm:right-3"
            aria-label="Next promotion"
          >
            <span className="hero-edge-button__bubble" aria-hidden="true" />
            <span className="hero-edge-button__shape" aria-hidden="true" />
            {nextRippleKey > 0 && (
              <>
                <span
                  key={`next-ripple-one-${nextRippleKey}`}
                  className="hero-edge-button__ripple hero-edge-button__ripple--one hero-edge-button__ripple--play"
                  aria-hidden="true"
                />
                <span
                  key={`next-ripple-two-${nextRippleKey}`}
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

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 max-md:bottom-7">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeSlide === index
                    ? "w-10 bg-[var(--site-accent)]"
                    : "w-2.5 bg-[var(--site-border)]"
                }`}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
