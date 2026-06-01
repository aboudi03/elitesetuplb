// *********************
// Role of the component: Sidebar on admin dashboard page
// Name of the component: DashboardSidebar.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardSidebar />
// Input parameters: no input parameters
// Output: sidebar for admin dashboard page
// *********************

import React from "react";
import { MdDashboard } from "react-icons/md";
import { FaTable } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa6";
import { FaGear } from "react-icons/fa6";
import { FaBagShopping } from "react-icons/fa6";
import { FaStore } from "react-icons/fa6";
import { MdCategory } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";
import { FaImages } from "react-icons/fa6";

import Link from "next/link";

const DashboardSidebar = () => {
  const itemClassName =
    "flex shrink-0 gap-x-2 hover:bg-[var(--site-accent)] hover:text-white cursor-pointer items-center px-5 py-5 text-lg text-[var(--site-text)] xl:w-full xl:text-xl max-xl:rounded-md max-sm:px-4 max-sm:py-3 max-sm:text-sm";

  return (
    <nav className="h-full border-r border-[var(--site-border)] bg-[var(--site-panel)] xl:w-[340px] max-xl:flex max-xl:w-full max-xl:gap-2 max-xl:overflow-x-auto max-xl:border-b max-xl:border-r-0 max-xl:p-2">
      <Link href="/admin">
        <div className={itemClassName}>
          <MdDashboard className="text-2xl" />{" "}
          <span className="font-normal">Dashboard</span>
        </div>
      </Link>
      <Link href="/admin/orders">
        <div className={itemClassName}>
          <FaBagShopping className="text-2xl" />{" "}
          <span className="font-normal">Orders</span>
        </div>
      </Link>
      <Link href="/admin/products">
        <div className={itemClassName}>
          <FaTable className="text-2xl" />{" "}
          <span className="font-normal">Products</span>
        </div>
      </Link>
      <Link href="/admin/bulk-upload">
        <div className={itemClassName}>
          <FaFileUpload className="text-2xl" />{" "}
          <span className="font-normal">Bulk Upload</span>
        </div>
      </Link>
      <Link href="/admin/hero-slides">
        <div className={itemClassName}>
          <FaImages className="text-2xl" />{" "}
          <span className="font-normal">Hero Slides</span>
        </div>
      </Link>
      <Link href="/admin/categories">
        <div className={itemClassName}>
          <MdCategory className="text-2xl" />{" "}
          <span className="font-normal">Categories</span>
        </div>
      </Link>
      <Link href="/admin/users">
        <div className={itemClassName}>
          <FaRegUser className="text-2xl" />{" "}
          <span className="font-normal">Users</span>
        </div>
      </Link>
      <Link href="/admin/merchant">
        <div className={itemClassName}>
          <FaStore className="text-2xl" />{" "}
          <span className="font-normal">Merchant</span>
        </div>
      </Link>
        <Link href="/admin/settings">
            <div className={itemClassName}>
                <FaGear className="text-2xl" />{" "}
                <span className="font-normal">Settings</span>
            </div>
        </Link>
    </nav>
  );
};

export default DashboardSidebar;
