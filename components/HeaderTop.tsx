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
import React from "react";
import toast from "react-hot-toast";
import { FaHeadphones } from "react-icons/fa6";
import { FaRegEnvelope } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa6";
import ThemeSelector from "./ThemeSelector";

const authLinkClassName =
  "inline-flex items-center gap-x-2 rounded-md border border-[var(--site-border)] px-3 py-1.5 font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)]";

const authPrimaryLinkClassName =
  "inline-flex items-center gap-x-2 rounded-md bg-[var(--site-accent)] px-3 py-1.5 font-semibold text-white transition hover:bg-[var(--site-accent-strong)]";

const HeaderTop = () => {
  const { data: session }: any = useSession();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  }
  return (
    <div className="hidden min-h-10 border-b border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-muted)] md:block max-lg:px-5">
      <div className="mx-auto flex min-h-10 max-w-screen-2xl justify-between gap-3 px-12 py-2 max-lg:flex-col max-lg:items-center max-lg:justify-center max-sm:px-0">
        <ul className="flex h-full flex-wrap items-center justify-center gap-x-5 gap-y-2 max-sm:text-sm max-[370px]:gap-x-2">
          <li className="flex items-center gap-x-2 font-semibold">
            <FaHeadphones className="text-[var(--site-accent)]" />
            <span>Gaming support</span>
          </li>
          <li className="flex items-center gap-x-2 font-semibold max-sm:hidden">
            <FaRegEnvelope className="text-[var(--site-accent)] text-xl" />
            <span>support@gearforge.test</span>
          </li>
        </ul>
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
            <button onClick={() => handleLogout()} className="flex items-center gap-x-2 font-semibold">
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
