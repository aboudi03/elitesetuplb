"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaCheck, FaMoon, FaSun } from "react-icons/fa6";

const themes = [
  { value: "light", label: "White", icon: FaSun },
  { value: "dark", label: "Dark", icon: FaMoon },
];

const ThemeSelector = () => {
  const [theme, setTheme] = useState("light");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("store-theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    window.localStorage.setItem("store-theme", value);
    document.documentElement.setAttribute("data-theme", value);
    setIsOpen(false);
  };

  const activeTheme = themes.find((item) => item.value === theme) || themes[0];
  const ActiveIcon = activeTheme.icon;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <ActiveIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-1 shadow-xl">
          {themes.map((item) => {
            const Icon = item.icon;
            const isActive = item.value === theme;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleThemeChange(item.value)}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {isActive && <FaCheck className="h-3.5 w-3.5 text-[var(--site-accent)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
