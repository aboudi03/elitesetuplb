"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import React from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

type ReportChartDataset = {
  label: string;
  data: number[];
  color: string;
};

type ReportChartProps = {
  title: string;
  labels: string[];
  datasets: ReportChartDataset[];
  type?: "bar" | "line";
  valuePrefix?: string;
  actions?: React.ReactNode;
  chartOnly?: boolean;
};

const ReportChart = ({
  title,
  labels,
  datasets,
  type = "line",
  valuePrefix = "$",
  actions,
  chartOnly = false,
}: ReportChartProps) => {
  const data = {
    labels,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: type === "line" ? `${dataset.color}22` : `${dataset.color}cc`,
      borderWidth: 2,
      borderRadius: type === "bar" ? 8 : 0,
      fill: type === "line",
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          color: "#4b5563",
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label}: ${valuePrefix}${Number(context.parsed.y || 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6b7280",
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(107,114,128,0.16)",
        },
        ticks: {
          color: "#6b7280",
          callback: (value: string | number) => `${valuePrefix}${Number(value).toFixed(0)}`,
        },
      },
    },
  };

  const ChartComponent = type === "bar" ? Bar : Line;
  const chartContent = (
    <div className={chartOnly ? "h-full min-h-[320px] min-w-0" : "mt-4 h-[320px] min-w-0"}>
      {labels.length > 0 ? (
        <ChartComponent data={data} options={options} />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--site-border)] text-sm text-[var(--site-muted)]">
          No chart data yet.
        </div>
      )}
    </div>
  );

  if (chartOnly) {
    return chartContent;
  }

  return (
    <section className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {chartContent}
    </section>
  );
};

export default ReportChart;
