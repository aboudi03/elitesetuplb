"use client";

import React, { useEffect, useRef, useState } from "react";
import ProductItem from "./ProductItem";

type LazyProductShelfProps = {
  products: Product[];
  gridClassName: string;
  itemClassName?: string;
  placeholderCount?: number;
  scrollKey?: string;
};

const LazyProductShelf = ({
  products,
  gridClassName,
  itemClassName = "",
  placeholderCount = 4,
  scrollKey,
}: LazyProductShelfProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [mobileScrollStep, setMobileScrollStep] = useState(0);

  useEffect(() => {
    const node = containerRef.current;

    if (!node || isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!scrollKey || !containerRef.current) {
      return;
    }

    const restoreFrame = window.requestAnimationFrame(() => {
      if (!containerRef.current) {
        return;
      }

      containerRef.current.scrollLeft = scrollPositionsRef.current[scrollKey] || 0;
    });

    return () => {
      window.cancelAnimationFrame(restoreFrame);
    };
  }, [isVisible, products.length, scrollKey]);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateMobileScrollStep = () => {
      const maxScrollLeft = node.scrollWidth - node.clientWidth;
      const indicatorCount = Math.min(products.length, 4);

      if (maxScrollLeft <= 0 || indicatorCount <= 1) {
        setMobileScrollStep(0);
        return;
      }

      setMobileScrollStep(
        Math.round((node.scrollLeft / maxScrollLeft) * (indicatorCount - 1))
      );
    };

    updateMobileScrollStep();
    window.addEventListener("resize", updateMobileScrollStep);

    return () => {
      window.removeEventListener("resize", updateMobileScrollStep);
    };
  }, [isVisible, products.length]);

  const handleScroll = () => {
    if (!containerRef.current) {
      return;
    }

    const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    const indicatorCount = Math.min(products.length, 4);

    if (scrollKey) {
      scrollPositionsRef.current[scrollKey] = containerRef.current.scrollLeft;
    }

    if (maxScrollLeft > 0 && indicatorCount > 1) {
      setMobileScrollStep(
        Math.round((containerRef.current.scrollLeft / maxScrollLeft) * (indicatorCount - 1))
      );
    }
  };

  const visiblePlaceholderCount = Math.min(
    Math.max(placeholderCount, 1),
    Math.max(products.length, 1)
  );

  if (products.length === 0) {
    return null;
  }

  const indicatorCount = Math.min(products.length, 4);

  return (
    <>
      <div ref={containerRef} className={gridClassName} onScroll={handleScroll}>
        {isVisible
          ? products.map((product) => (
              <div key={product.id} className={itemClassName}>
                <ProductItem product={product} quickAddEnabled mobileCardLinkEnabled />
              </div>
            ))
          : Array.from({ length: visiblePlaceholderCount }).map((_, index) => (
              <div
                key={`product-skeleton-${index}`}
                className={`overflow-hidden rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-panel)]/80 ${itemClassName}`}
                aria-hidden="true"
              >
                <div className="aspect-[4/3] min-h-[220px] animate-pulse bg-[color-mix(in_srgb,var(--site-panel-soft)_86%,white_14%)] sm:min-h-[300px]" />
                <div className="space-y-3 p-5 sm:p-6">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--site-panel-soft)_82%,white_18%)]" />
                  <div className="h-5 w-4/5 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--site-panel-soft)_80%,white_20%)]" />
                  <div className="h-5 w-28 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--site-accent-soft)_60%,var(--site-panel-soft)_40%)]" />
                </div>
              </div>
            ))}
      </div>
      {indicatorCount > 1 ? (
        <div
          className="mt-4 flex items-center justify-center gap-2 sm:hidden"
          aria-hidden="true"
        >
          {Array.from({ length: indicatorCount }).map((_, index) => (
            <span
              key={`product-scroll-indicator-${index}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === mobileScrollStep
                  ? "w-10 bg-[var(--site-accent)]"
                  : "w-2 bg-[color-mix(in_srgb,var(--site-muted)_56%,transparent)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </>
  );
};

export default LazyProductShelf;
