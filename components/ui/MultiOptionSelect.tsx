"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";

type MultiOption = {
  label: string;
  value: string;
  swatch?: string;
};

type MultiOptionSelectProps = {
  options: MultiOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  emptySummary: string;
};

export default function MultiOptionSelect({
  options,
  selectedValues,
  onChange,
  placeholder,
  emptySummary,
}: MultiOptionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const toggleValue = (value: string) => {
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((currentValue) => currentValue !== value)
      : [...selectedValues, value];

    onChange(nextValues);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-left text-base text-[var(--site-text)] shadow-sm transition hover:border-[var(--site-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent-soft)]"
      >
        <span className="truncate">
          {selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}
        </span>
        <FaChevronDown
          className={`ml-3 h-4 w-4 shrink-0 text-[var(--site-muted)] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] shadow-2xl">
          <div className="max-h-72 overflow-y-auto p-2">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition ${
                    isSelected
                      ? "bg-[var(--site-accent-soft)]"
                      : "hover:bg-[var(--site-panel-soft)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 rounded border-[var(--site-border)] text-[var(--site-accent)] focus:ring-[var(--site-accent)]"
                  />
                  {option.swatch ? (
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: option.swatch }}
                    />
                  ) : null}
                  <span className="text-sm font-medium text-[var(--site-text)]">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {selectedValues.length > 0 ? (
          options
            .filter((option) => selectedValues.includes(option.value))
            .map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-1.5 text-sm font-medium text-[var(--site-text)]"
              >
                {option.swatch ? (
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: option.swatch }}
                  />
                ) : null}
                {option.label}
              </span>
            ))
        ) : (
          <span className="text-sm text-[var(--site-muted)]">{emptySummary}</span>
        )}
      </div>
    </div>
  );
}
