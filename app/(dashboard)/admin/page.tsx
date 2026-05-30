"use client";
import { DashboardSidebar, StatsElement } from "@/components";
import React, { useEffect } from "react";
import { FaArrowUp } from "react-icons/fa6";

const AdminDashboardPage = () => {
  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)] flex justify-start max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex w-full flex-col items-center gap-y-4 p-4 xl:ml-5 xl:p-0 max-md:gap-y-3">
        <div className="grid w-full grid-cols-3 gap-4 max-lg:grid-cols-1">
          <StatsElement />
          <StatsElement />
          <StatsElement />
        </div>
        <div className="flex h-40 w-full flex-col items-center justify-center gap-y-2 rounded-md bg-[var(--site-accent)] px-4 text-center text-white">
          <h4 className="text-3xl text-gray-100 max-sm:text-2xl">
            Number of visitors today
          </h4>
          <p className="text-3xl font-bold">1200</p>
          <p className="text-green-300 flex gap-x-1 items-center">
            <FaArrowUp />
            12.5% Since last month
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

