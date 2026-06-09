// *********************
// Role of the component: Header component
// Name of the component: Header.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Header />
// Input parameters: no input parameters
// Output: Header component
// *********************

"use client";
import { usePathname } from "next/navigation";
import React from "react";
import HeaderTop from "./HeaderTop";
import SearchInput from "./SearchInput";
import Link from "next/link";
import CartElement from "./CartElement";
import NotificationBell from "./NotificationBell";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaRegUser } from "react-icons/fa6";
import { FaRightFromBracket } from "react-icons/fa6";
import ThemeSelector from "./ThemeSelector";
import EliteSetupLogo from "./EliteSetupLogo";

const Header = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  return (
    <header className="relative z-[100] border-b border-[var(--site-border)] bg-[var(--site-panel)]/95 backdrop-blur lg:sticky lg:top-0">
      <HeaderTop />
      {pathname.startsWith("/admin") === false && (
        <div className="mx-auto flex min-h-24 max-w-screen-2xl items-center justify-between gap-8 px-16 py-5 max-[1320px]:px-16 max-lg:flex-col max-lg:justify-center max-lg:gap-y-5 max-md:min-h-0 max-md:gap-3 max-md:px-4 max-md:py-3">
          <div className="flex w-full items-center justify-between gap-3 lg:w-auto">
            <EliteSetupLogo
              iconClassName="h-11 w-11 max-sm:h-9 max-sm:w-9"
              textClassName="font-bold"
            />

            <div className="hidden items-center gap-2 max-md:flex">
              <NotificationBell />
              <CartElement />
              {session?.user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                >
                  <FaRightFromBracket className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/login"
                  aria-label="Login"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                >
                  <FaRegUser className="h-4 w-4" />
                </Link>
              )}
              <ThemeSelector />
            </div>
          </div>

          <SearchInput />
          <div className="flex items-center gap-x-10 max-md:hidden">
            <NotificationBell />
            <CartElement />
          </div>
        </div>
      )}
      {pathname.startsWith("/admin") === true && (
        <div className="mx-auto flex h-24 max-w-screen-2xl items-center justify-between gap-4 bg-[var(--site-panel)] px-16 max-[1320px]:px-10 max-sm:h-auto max-sm:flex-col max-sm:py-4 max-[400px]:px-5">
          <EliteSetupLogo
            iconClassName="h-11 w-11 max-sm:h-9 max-sm:w-9"
            textClassName="font-bold"
          />
          <div className="flex gap-x-5 items-center">
            <NotificationBell />
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                aria-label="Open user menu"
              >
                <FaRegUser className="h-5 w-5" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/admin">Dashboard</Link>
                </li>
                <li>
                  <a>Profile</a>
                </li>
                <li onClick={handleLogout}>
                  <a href="#">Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
