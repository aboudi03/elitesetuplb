// *********************
// Role of the component: Footer component
// Name of the component: Footer.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Footer />
// Input parameters: no input parameters
// Output: Footer component
// *********************

import { navigation } from "@/lib/utils";
import Link from "next/link";
import React from "react";

const hiddenFooterLinks = new Set([
  "Elite Setup Loyalty Card",
  "How to Buy at Elite Setup",
  "Complaints",
]);

const Footer = () => {
  return (
    <footer className="border-t border-[var(--site-border)] bg-[var(--site-panel)]" aria-labelledby="footer-heading">
      <div>
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Link href="/about-us" className="text-sm font-bold leading-6 text-[var(--site-accent)] hover:underline">
                About Us
              </Link>
              <ul role="list" className="mt-3 space-y-2.5">
                {navigation.about.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm leading-6 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Link href="/buying" className="text-sm font-bold leading-6 text-[var(--site-accent)] hover:underline">
                Buying
              </Link>
              <ul role="list" className="mt-3 space-y-2.5">
                {navigation.buy.filter((item) => !hiddenFooterLinks.has(item.name)).map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm leading-6 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Link href="/support" className="text-sm font-bold leading-6 text-[var(--site-accent)] hover:underline">
                Support
              </Link>
              <ul role="list" className="mt-3 space-y-2.5">
                {navigation.help.filter((item) => !hiddenFooterLinks.has(item.name)).map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm leading-6 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
