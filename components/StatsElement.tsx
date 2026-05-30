// *********************
// IN DEVELOPMENT
// *********************

import React from "react";
import { FaArrowUp } from "react-icons/fa6";


const StatsElement = () => {
  return (
    <div className="flex h-32 w-full flex-col items-center justify-center rounded-md bg-[var(--site-accent-soft)] px-4 text-center text-[var(--site-text)]">
      <h4 className="text-xl font-semibold">New Products</h4>
      <p className="text-2xl font-bold">2,230</p>
      <p className="text-green-300 flex gap-x-1 items-center"><FaArrowUp />12.5% Since last month</p>
    </div>
  );
};

export default StatsElement;

