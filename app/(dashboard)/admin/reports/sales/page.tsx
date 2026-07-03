"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import ReportChart from "@/components/ReportChart";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type ReportResponse = {
  summary: {
    orderCount: number;
    itemCount: number;
    revenue: number;
    averageOrderValue: number;
  };
  daily: Array<{
    date: string;
    orders: number;
    revenue: number;
    cogs: number;
    profit: number;
  }>;
  orders: Array<{
    id: string;
    orderNumber?: number | null;
    dateTime: string;
    status: string;
    total: number;
    name: string;
    lastname: string;
  }>;
};

type OrderStatusOption = {
  id: string;
  code: string;
  name: string;
  groupCode: string;
};

const cardClassName =
  "rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm";
const inputClassName =
  "min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm text-[var(--site-text)]";

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const SalesReportPage = () => {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [statuses, setStatuses] = useState<OrderStatusOption[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [dateFrom, dateTo, status]);

  const dailyChartRows = useMemo(() => [...(report?.daily || [])].reverse(), [report?.daily]);
  const soldStatusOptions = useMemo(
    () => statuses.filter((item) => item.groupCode === "completed"),
    [statuses]
  );

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const response = await apiClient.get("/api/order-statuses");
        const data = await response.json();
        if (response.ok) {
          setStatuses(data?.statuses || []);
        }
      } catch {
        setStatuses([]);
      }
    };

    loadStatuses();
  }, []);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);

      try {
        const response = await apiClient.get(`/api/reports/sales-profit?${query}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.details || data?.error || "Failed to load sales report");
        }

        setReport(data);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load sales report");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [query]);

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <main className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-6 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
            Reports
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sales report</h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={inputClassName} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={inputClassName} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClassName}>
            <option value="all">All sold statuses</option>
            {soldStatusOptions.map((item) => (
              <option key={item.id} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Revenue</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(report?.summary.revenue || 0)}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Orders</p>
            <p className="mt-2 text-3xl font-bold">{report?.summary.orderCount || 0}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Items sold</p>
            <p className="mt-2 text-3xl font-bold">{report?.summary.itemCount || 0}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Average order</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(report?.summary.averageOrderValue || 0)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <ReportChart
            title="Sales graph"
            labels={dailyChartRows.map((row) => row.date)}
            datasets={[
              {
                label: "Merchandise revenue",
                data: dailyChartRows.map((row) => row.revenue),
                color: "#d90429",
              },
            ]}
          />
          <ReportChart
            title="Orders graph"
            labels={dailyChartRows.map((row) => row.date)}
            datasets={[
              {
                label: "Orders",
                data: dailyChartRows.map((row) => row.orders),
                color: "#047857",
              },
            ]}
            type="bar"
            valuePrefix=""
          />
        </div>

        <section className={`${cardClassName} mt-6`}>
          <h2 className="text-2xl font-semibold">Daily sales</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.08em] text-[var(--site-muted)]">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Orders</th>
                  <th className="py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={3}>Loading...</td></tr>
                ) : report?.daily.length ? (
                  report.daily.map((row) => (
                    <tr key={row.date} className="border-t border-[var(--site-border)]">
                      <td className="py-3 font-semibold">{row.date}</td>
                      <td className="py-3">{row.orders}</td>
                      <td className="py-3">{formatMoney(row.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={3}>No sales found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SalesReportPage;
