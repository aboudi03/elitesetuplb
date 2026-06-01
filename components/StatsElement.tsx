import React from "react";
import { FaArrowDown, FaArrowUp, FaMinus } from "react-icons/fa6";

type StatsElementProps = {
  title: string;
  value: number | string;
  comparisonLabel: string;
  trend: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
};

const StatsElement = ({
  title,
  value,
  comparisonLabel,
  trend,
}: StatsElementProps) => {
  const TrendIcon =
    trend.direction === "up" ? FaArrowUp : trend.direction === "down" ? FaArrowDown : FaMinus;

  const trendClassName =
    trend.direction === "up"
      ? "text-emerald-500"
      : trend.direction === "down"
        ? "text-rose-500"
        : "text-[var(--site-muted)]";

  return (
    <div className="flex h-32 w-full flex-col items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-4 text-center text-[var(--site-text)]">
      <h4 className="text-xl font-semibold">{title}</h4>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`flex items-center gap-x-1 text-sm ${trendClassName}`}>
        <TrendIcon />
        {trend.value}% {comparisonLabel}
      </p>
    </div>
  );
};

export default StatsElement;

