"use client";

// *********************
// Role of the component: Sidebar on admin dashboard page
// Name of the component: DashboardSidebar.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardSidebar />
// Input parameters: no input parameters
// Output: sidebar for admin dashboard page
// *********************

import React, { useMemo, useState } from "react";
import { MdCategory, MdDashboard } from "react-icons/md";
import {
  FaBagShopping,
  FaBoxArchive,
  FaChevronLeft,
  FaChevronDown,
  FaClockRotateLeft,
  FaGear,
  FaImages,
  FaBars,
  FaRegUser,
  FaStore,
  FaTable,
  FaBarsStaggered,
  FaTag,
  FaPercent,
  FaChartLine,
} from "react-icons/fa6";
import { FaFileUpload } from "react-icons/fa";
import Link from "next/link";

const DashboardSidebar = () => {
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const isOpen = useMemo(() => isPinnedOpen || isHoverOpen, [isHoverOpen, isPinnedOpen]);

  const itemClassName =
    "flex shrink-0 gap-x-2 hover:bg-[var(--site-accent)] hover:text-white cursor-pointer items-center rounded-md px-5 py-4 text-lg text-[var(--site-text)] xl:w-full xl:text-xl max-sm:px-4 max-sm:py-3 max-sm:text-sm";
  const childItemClassName =
    "flex shrink-0 items-center gap-x-2 rounded-md px-10 py-3 text-sm text-[var(--site-muted)] transition hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] xl:w-full max-xl:px-4 max-sm:text-sm";
  const groupButtonClassName =
    "flex shrink-0 cursor-pointer items-center justify-between gap-x-2 rounded-md px-5 py-4 text-lg text-[var(--site-text)] hover:bg-[var(--site-accent)] hover:text-white xl:w-full xl:text-xl max-sm:px-4 max-sm:py-3 max-sm:text-sm";

  const handleTemporaryClose = () => {
    if (!isPinnedOpen) {
      setIsHoverOpen(false);
    }
  };

  const handleLinkClick = () => {
    setIsHoverOpen(false);
    setIsPinnedOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close admin sidebar" : "Open admin sidebar"}
        onClick={() => {
          setIsPinnedOpen((current) => !current);
          setIsHoverOpen(false);
        }}
        className="fixed left-4 top-28 z-[70] flex h-11 w-11 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] shadow-lg transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
      >
        {isOpen ? <FaChevronLeft className="h-4 w-4" /> : <FaBars className="h-4 w-4" />}
      </button>

      <div
        className="fixed inset-y-0 left-0 z-[55] hidden w-5 xl:block"
        onMouseEnter={() => setIsHoverOpen(true)}
      />

      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-[58] bg-black/20 xl:hidden"
          onClick={() => {
            setIsPinnedOpen(false);
            setIsHoverOpen(false);
          }}
        />
      )}

      <nav
        className={`fixed left-0 top-0 z-[60] flex h-screen w-[320px] flex-col gap-2 overflow-y-auto border-r border-[var(--site-border)] bg-[var(--site-panel)] px-3 pb-6 pt-24 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        onMouseEnter={() => setIsHoverOpen(true)}
        onMouseLeave={handleTemporaryClose}
      >
      <Link href="/admin" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <MdDashboard className="text-2xl" />
          <span className="font-normal">Dashboard</span>
        </div>
      </Link>

      <div className="shrink-0 xl:w-full">
        <button
          type="button"
          className={groupButtonClassName}
          onClick={() => setOrdersOpen((current) => !current)}
        >
          <span className="flex items-center gap-x-2">
            <FaBagShopping className="text-2xl" />
            <span className="font-normal">Orders</span>
          </span>
          <FaChevronDown
            className={`text-sm transition ${ordersOpen ? "rotate-180" : ""}`}
          />
        </button>
        {ordersOpen && (
          <div className="xl:border-l xl:border-[var(--site-border)] xl:ml-7 max-xl:flex max-xl:flex-col max-xl:gap-2">
            <Link href="/admin/orders" onClick={handleLinkClick}>
              <div className={childItemClassName}>
                <FaBagShopping />
                <span>All Orders</span>
              </div>
            </Link>
            <Link href="/admin/orders/history" onClick={handleLinkClick}>
              <div className={childItemClassName}>
                <FaClockRotateLeft />
                <span>Order History</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      <div className="shrink-0 xl:w-full">
        <button
          type="button"
          className={groupButtonClassName}
          onClick={() => setProductsOpen((current) => !current)}
        >
          <span className="flex items-center gap-x-2">
            <FaTable className="text-2xl" />
            <span className="font-normal">Products</span>
          </span>
          <FaChevronDown
            className={`text-sm transition ${productsOpen ? "rotate-180" : ""}`}
          />
        </button>
        {productsOpen && (
          <div className="xl:border-l xl:border-[var(--site-border)] xl:ml-7 max-xl:flex max-xl:flex-col max-xl:gap-2">
            <Link href="/admin/products" onClick={handleLinkClick}>
              <div className={childItemClassName}>
                <FaTable />
                <span>All Products</span>
              </div>
            </Link>
            <Link href="/admin/bulk-upload" onClick={handleLinkClick}>
              <div className={childItemClassName}>
                <FaFileUpload />
                <span>Bulk Upload</span>
              </div>
            </Link>
            <Link href="/admin/products/stock-history" onClick={handleLinkClick}>
              <div className={childItemClassName}>
                <FaBoxArchive />
                <span>Product History</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      <Link href="/admin/hero-slides" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaImages className="text-2xl" />
          <span className="font-normal">Hero Slides</span>
        </div>
      </Link>
      <Link href="/admin/featured-brands" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaTag className="text-2xl" />
          <span className="font-normal">Featured Brands</span>
        </div>
      </Link>
      <Link href="/admin/deals" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaPercent className="text-2xl" />
          <span className="font-normal">Deals</span>
        </div>
      </Link>
      <Link href="/admin/product-banners" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaImages className="text-2xl" />
          <span className="font-normal">Product Banners</span>
        </div>
      </Link>
      <Link href="/admin/reports/sales" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaChartLine className="text-2xl" />
          <span className="font-normal">Sales Report</span>
        </div>
      </Link>
      <Link href="/admin/reports/profit" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaChartLine className="text-2xl" />
          <span className="font-normal">Profit Report</span>
        </div>
      </Link>
      <Link href="/admin/categories" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <MdCategory className="text-2xl" />
          <span className="font-normal">Categories</span>
        </div>
      </Link>
      <Link href="/admin/navbar-categories" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaBarsStaggered className="text-2xl" />
          <span className="font-normal">Navbar Categories</span>
        </div>
      </Link>
      <Link href="/admin/users" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaRegUser className="text-2xl" />
          <span className="font-normal">Users</span>
        </div>
      </Link>
      <Link href="/admin/merchant" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaStore className="text-2xl" />
          <span className="font-normal">Merchant</span>
        </div>
      </Link>
      <Link href="/admin/settings" onClick={handleLinkClick}>
        <div className={itemClassName}>
          <FaGear className="text-2xl" />
          <span className="font-normal">Settings</span>
        </div>
      </Link>
      </nav>
    </>
  );
};

export default DashboardSidebar;
