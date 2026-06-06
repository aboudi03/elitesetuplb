"use client";
import {
  CustomButton,
  DashboardProductTable,
  DashboardSidebar,
} from "@/components";
import React from "react";

const DashboardProducts = () => {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1760px] justify-start gap-3 bg-[var(--site-bg)] px-3 text-[var(--site-text)] max-xl:h-fit max-xl:flex-col max-xl:gap-y-4 max-sm:px-2">
      <DashboardSidebar />
        <DashboardProductTable />
    </div>
  );
};

export default DashboardProducts;

