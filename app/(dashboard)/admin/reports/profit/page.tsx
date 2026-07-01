"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type ReportResponse = {
  summary: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    margin: number;
  };
  daily: Array<{
    date: string;
    revenue: number;
    cogs: number;
    profit: number;
  }>;
  products: Array<{
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    estimatedRevenue: number;
    cogs: number;
    estimatedProfit: number;
  }>;
};

type OrderStatusOption = {
  id: string;
  code: string;
  name: string;
};

const cardClassName =
  "rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm";
const inputClassName =
  "min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm text-[var(--site-text)]";
const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const ProfitReportPage = () => {
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
          throw new Error(data?.details || data?.error || "Failed to load profit report");
        }

        setReport(data);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load profit report");
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
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Profit report</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--site-muted)]">
            Profit uses order subtotal revenue and product cost multiplied by sold quantity. Product revenue rows are estimates because old order items do not store sold unit price snapshots.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={inputClassName} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={inputClassName} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClassName}>
            <option value="all">All statuses</option>
            {statuses.map((item) => (
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
            <p className="text-sm text-[var(--site-muted)]">COGS</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(report?.summary.cogs || 0)}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Gross profit</p>
            <p className="mt-2 text-3xl font-bold text-[var(--site-accent)]">{formatMoney(report?.summary.grossProfit || 0)}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Margin</p>
            <p className="mt-2 text-3xl font-bold">{Number(report?.summary.margin || 0).toFixed(1)}%</p>
          </div>
        </div>

        <section className={`${cardClassName} mt-6`}>
          <h2 className="text-2xl font-semibold">Product profit</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.08em] text-[var(--site-muted)]">
                <tr>
                  <th className="py-3">Product</th>
                  <th className="py-3">Qty</th>
                  <th className="py-3">Unit cost</th>
                  <th className="py-3">COGS</th>
                  <th className="py-3">Est. revenue</th>
                  <th className="py-3">Est. profit</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={6}>Loading...</td></tr>
                ) : report?.products.length ? (
                  report.products.map((row) => (
                    <tr key={row.productId} className="border-t border-[var(--site-border)]">
                      <td className="py-3">
                        <p className="font-semibold">{sanitize(row.title)}</p>
                        <p className="text-xs text-[var(--site-muted)]">{sanitize(row.sku || "-")}</p>
                      </td>
                      <td className="py-3">{row.quantity}</td>
                      <td className="py-3">{formatMoney(row.unitCost)}</td>
                      <td className="py-3">{formatMoney(row.cogs)}</td>
                      <td className="py-3">{formatMoney(row.estimatedRevenue)}</td>
                      <td className="py-3 font-semibold text-[var(--site-accent)]">{formatMoney(row.estimatedProfit)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={6}>No profit data found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfitReportPage;
