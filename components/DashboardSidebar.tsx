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

import React, { useState } from "react";
import { MdCategory, MdDashboard } from "react-icons/md";
import {
  FaBagShopping,
  FaBoxArchive,
  FaChevronDown,
  FaClockRotateLeft,
  FaGear,
  FaImages,
  FaRegUser,
  FaStore,
  FaTable,
} from "react-icons/fa6";
import { FaFileUpload } from "react-icons/fa";
import Link from "next/link";

const DashboardSidebar = () => {
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);

  const itemClassName =
    "flex shrink-0 gap-x-2 hover:bg-[var(--site-accent)] hover:text-white cursor-pointer items-center px-5 py-5 text-lg text-[var(--site-text)] xl:w-full xl:text-xl max-xl:rounded-md max-sm:px-4 max-sm:py-3 max-sm:text-sm";
  const childItemClassName =
    "flex shrink-0 items-center gap-x-2 px-10 py-3 text-sm text-[var(--site-muted)] transition hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] xl:w-full max-xl:rounded-md max-xl:px-4 max-sm:text-sm";
  const groupButtonClassName =
    "flex shrink-0 cursor-pointer items-center justify-between gap-x-2 px-5 py-5 text-lg text-[var(--site-text)] hover:bg-[var(--site-accent)] hover:text-white xl:w-full xl:text-xl max-xl:rounded-md max-sm:px-4 max-sm:py-3 max-sm:text-sm";

  return (
    <nav className="h-full border-r border-[var(--site-border)] bg-[var(--site-panel)] xl:w-[340px] max-xl:flex max-xl:w-full max-xl:gap-2 max-xl:overflow-x-auto max-xl:border-b max-xl:border-r-0 max-xl:p-2">
      <Link href="/admin">
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
          <div className="xl:border-l xl:border-[var(--site-border)] xl:ml-7 max-xl:flex max-xl:gap-2">
            <Link href="/admin/orders">
              <div className={childItemClassName}>
                <FaBagShopping />
                <span>All Orders</span>
              </div>
            </Link>
            <Link href="/admin/orders/history">
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
          <div className="xl:border-l xl:border-[var(--site-border)] xl:ml-7 max-xl:flex max-xl:gap-2">
            <Link href="/admin/products">
              <div className={childItemClassName}>
                <FaTable />
                <span>All Products</span>
              </div>
            </Link>
            <Link href="/admin/bulk-upload">
              <div className={childItemClassName}>
                <FaFileUpload />
                <span>Bulk Upload</span>
              </div>
            </Link>
            <Link href="/admin/products/stock-history">
              <div className={childItemClassName}>
                <FaBoxArchive />
                <span>Product History</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      <Link href="/admin/hero-slides">
        <div className={itemClassName}>
          <FaImages className="text-2xl" />
          <span className="font-normal">Hero Slides</span>
        </div>
      </Link>
      <Link href="/admin/categories">
        <div className={itemClassName}>
          <MdCategory className="text-2xl" />
          <span className="font-normal">Categories</span>
        </div>
      </Link>
      <Link href="/admin/users">
        <div className={itemClassName}>
          <FaRegUser className="text-2xl" />
          <span className="font-normal">Users</span>
        </div>
      </Link>
      <Link href="/admin/merchant">
        <div className={itemClassName}>
          <FaStore className="text-2xl" />
          <span className="font-normal">Merchant</span>
        </div>
      </Link>
      <Link href="/admin/settings">
        <div className={itemClassName}>
          <FaGear className="text-2xl" />
          <span className="font-normal">Settings</span>
        </div>
      </Link>
    </nav>
  );
};

export default DashboardSidebar;
