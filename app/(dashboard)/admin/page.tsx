"use client";
import { DashboardSidebar, StatsElement } from "@/components";
import apiClient from "@/lib/api";
import React, { useEffect, useState } from "react";

type DashboardMetric = {
  key: string;
  label: string;
  value: number;
  comparisonLabel: string;
  trend: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
};

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiClient.get("/api/dashboard-metrics");
        const data = await response.json();
        setMetrics(Array.isArray(data?.metrics) ? data.metrics : []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)] flex justify-start max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex w-full flex-col items-center gap-y-4 p-4 xl:ml-5 xl:p-0 max-md:gap-y-3">
        <div className="grid w-full grid-cols-4 gap-4 max-xl:grid-cols-2 max-lg:grid-cols-1">
          {metrics.map((metric) => (
            <StatsElement
              key={metric.key}
              title={metric.label}
              value={metric.value.toLocaleString()}
              comparisonLabel={metric.comparisonLabel}
              trend={metric.trend}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

