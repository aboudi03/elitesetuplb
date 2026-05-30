"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const slides = [
  {
    eyebrow: "Audio drop",
    title: "HyperX Cloud III",
    subtitle: "Comfortable wired headset with clear voice, deep game audio, and a clean black setup look.",
    image: "/pexels-format-1029757.jpg",
    productImage: "https://hyperx.com/cdn/shop/files/hyperx_cloud_iii_black_66x0048_main_1_c352faf1-cd4b-4be0-b3cb-2d49d3581ae9_1024x1024.jpg?v=1775587372",
    href: "/shop/gaming-headsets",
  },
  {
    eyebrow: "Pro wireless mice",
    title: "Logitech G Pro Wireless",
    subtitle: "Lightweight wireless control for fast flicks, clean aim, and competitive desk setups.",
    image: "/pexels-lex-photography-1109543.jpg",
    productImage: "https://s24.q4cdn.com/131595232/files/doc_multimedia/2018/08/1/Low_Resolution_JPG-PRO_Wireless_Top_BB.jpg",
    href: "/shop/gaming-mice",
  },
  {
    eyebrow: "RGB keyboards",
    title: "HyperX Alloy Origins",
    subtitle: "Mechanical switches, compact aluminum build, and bright RGB for your main setup.",
    image: "/pexels-pixabay-163007.jpg",
    productImage: "https://row.hyperx.com/cdn/shop/products/hyperx_alloy_origins_pbt_hx_aqua_tw_angle_2_1024x1024.jpg?v=1666376510",
    href: "/shop/gaming-keyboards",
  },
];

const heroCategories = [
  { label: "Mice", href: "/shop/gaming-mice" },
  { label: "Keyboards", href: "/shop/gaming-keyboards" },
  { label: "Headsets", href: "/shop/gaming-headsets" },
  { label: "Monitors", href: "/shop/gaming-monitors" },
  { label: "Laptops", href: "/shop/gaming-laptops" },
  { label: "PC Builds", href: "/shop/gaming-pcs" },
  { label: "Components", href: "/shop/pc-components" },
  { label: "Streaming", href: "/shop/streaming-gear" },
  { label: "Deals", href: "/shop" },
];

const Hero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">("next");
  const autoplayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = window.setTimeout(() => {
      setSlideDirection("next");
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [activeSlide]);

  const slide = slides[activeSlide];
  const goToPreviousSlide = () => {
    setSlideDirection("previous");
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setSlideDirection("next");
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <section className="bg-[var(--site-bg)] pb-8">
      <nav className="border-b border-[var(--site-border)] bg-[var(--site-panel)]">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-center gap-9 overflow-x-auto px-4 py-3 text-sm font-semibold text-[var(--site-text)] max-lg:justify-start">
          {heroCategories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="whitespace-nowrap transition hover:text-[var(--site-accent)]"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-screen-2xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="relative min-h-[460px] overflow-hidden border border-[var(--site-border)] bg-[var(--site-panel)] max-md:min-h-[680px] max-sm:min-h-[640px]">
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
            className={`absolute left-0 top-0 z-10 flex h-full w-[46%] min-w-[470px] flex-col justify-center rounded-r-[120px] border-r border-[var(--site-border)] bg-[var(--site-panel)] px-8 py-10 shadow-[18px_0_45px_rgba(0,0,0,0.12)] max-md:left-4 max-md:top-4 max-md:h-auto max-md:w-[calc(100%-2rem)] max-md:min-w-0 max-md:rounded-md max-md:border max-md:px-5 max-md:py-6 max-md:shadow-xl max-sm:px-4 max-sm:py-5 ${
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
            className={`absolute bottom-4 right-[12%] z-10 flex h-[72%] items-end max-md:bottom-16 max-md:left-0 max-md:right-0 max-md:h-[34%] max-md:justify-center max-sm:bottom-14 max-sm:h-[30%] ${
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
              className="max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]"
            />
          </div>

          <button
            type="button"
            onClick={goToPreviousSlide}
            className="absolute left-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--site-panel)] text-[var(--site-text)] shadow transition hover:bg-[var(--site-accent)] hover:text-white max-md:bottom-4 max-md:top-auto max-md:h-10 max-md:w-10 max-md:translate-y-0 max-sm:left-3"
            aria-label="Previous promotion"
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            onClick={goToNextSlide}
            className="absolute right-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--site-panel)] text-[var(--site-text)] shadow transition hover:bg-[var(--site-accent)] hover:text-white max-md:bottom-4 max-md:top-auto max-md:h-10 max-md:w-10 max-md:translate-y-0 max-sm:right-3"
            aria-label="Next promotion"
          >
            <FaChevronRight />
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
