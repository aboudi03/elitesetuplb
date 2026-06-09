// *********************
// Role of the component: Topbar of the header
// Name of the component: HeaderTop.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <HeaderTop />
// Input parameters: no input parameters
// Output: topbar with phone, email and login and register links
// *********************

"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaRegUser, FaWhatsapp } from "react-icons/fa6";
import { contactEmails } from "@/lib/utils";
import ThemeSelector from "./ThemeSelector";

const authLinkClassName =
  "inline-flex items-center gap-x-2 rounded-md border border-[var(--site-border)] px-3 py-1.5 font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)]";

const authPrimaryLinkClassName =
  "inline-flex items-center gap-x-2 rounded-md bg-[var(--site-accent)] px-3 py-1.5 font-semibold text-white transition hover:bg-[var(--site-accent-strong)]";

const whatsappHref = "https://wa.me/96171089840";

const HeaderTop = () => {
  const { data: session }: any = useSession();
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const showTopBarTimerRef = useRef<number | null>(null);

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  }

  useEffect(() => {
    const showAtTopThreshold = 1;
    const hideAfterScrollThreshold = 12;

    const clearShowTimer = () => {
      if (showTopBarTimerRef.current) {
        window.clearTimeout(showTopBarTimerRef.current);
        showTopBarTimerRef.current = null;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= showAtTopThreshold) {
        if (!showTopBarTimerRef.current) {
          showTopBarTimerRef.current = window.setTimeout(() => {
            setIsTopBarVisible(true);
            showTopBarTimerRef.current = null;
          }, 140);
        }
        return;
      }

      clearShowTimer();

      if (currentScrollY >= hideAfterScrollThreshold) {
        setIsTopBarVisible(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearShowTimer();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`hidden overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-muted)] transition-all duration-300 md:block max-lg:px-5 ${
        isTopBarVisible
          ? "max-h-20 opacity-100"
          : "max-h-0 border-b-0 opacity-0"
      }`}
    >
      <div className="mx-auto flex min-h-10 max-w-screen-2xl justify-between gap-3 px-12 py-2 max-lg:flex-col max-lg:items-center max-lg:justify-center max-sm:px-0">
        <div className="flex h-full flex-col items-center justify-center gap-y-0.5 text-sm max-sm:text-sm md:items-start">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-semibold">
            <span className="text-[var(--site-muted)]">Need help?</span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-x-2 text-[var(--site-text)] transition hover:text-[var(--site-accent)]"
            >
              <FaWhatsapp className="text-[var(--site-accent)]" />
              <span>Contact us on WhatsApp</span>
            </a>
          </div>
          <div className="text-xs font-medium text-[var(--site-muted)]">
            or send email{" "}
            <a
              href={`mailto:${contactEmails.support}`}
              className="font-semibold text-[var(--site-text)] transition hover:text-[var(--site-accent)]"
            >
              {contactEmails.support}
            </a>
          </div>
        </div>
        <ul className="flex h-full flex-wrap items-center justify-center gap-x-3 gap-y-2 font-semibold max-sm:text-sm max-[370px]:gap-x-2">
          {!session ? ( 
          <>
          <li className="flex items-center">
            <Link href="/login" className={authLinkClassName}>
              <FaRegUser />
              <span>Login</span>
            </Link>
          </li>
          <li className="flex items-center">
            <Link href="/register" className={authPrimaryLinkClassName}>
              <FaRegUser />
              <span>Sign up</span>
            </Link>
          </li>
          </>
          ) :  (<>
          <span className="ml-10 text-base">{session.user?.email}</span>
          <li className="flex items-center">
            <button onClick={() => handleLogout()} className={authLinkClassName}>
              <FaRegUser className="text-[var(--site-accent)]" />
              <span>Log out</span>
            </button>
          </li>
          </>)}
          <li>
            <ThemeSelector />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HeaderTop;
