"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import ReportChart from "@/components/ReportChart";
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
    manufacturer: string;
    categoryId: string;
    categoryName: string;
    merchantId: string;
    merchantName: string;
  }>;
  expected: {
    revenue: number;
    cogs: number;
    profit: number;
    itemCount: number;
    products: Array<{
      productId: string;
      title: string;
      sku: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      expectedRevenue: number;
      expectedCogs: number;
      expectedProfit: number;
      manufacturer: string;
      categoryId: string;
      categoryName: string;
      merchantId: string;
      merchantName: string;
    }>;
  };
};

type OrderStatusOption = {
  id: string;
  code: string;
  name: string;
};

type ProfitChartMode = "expected" | "real";

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
  const [profitChartMode, setProfitChartMode] = useState<ProfitChartMode>("expected");
  const [selectedGraphProductIds, setSelectedGraphProductIds] = useState<string[]>([]);
  const [graphCategoryFilter, setGraphCategoryFilter] = useState("all");
  const [graphMerchantFilter, setGraphMerchantFilter] = useState("all");
  const [graphBrandFilter, setGraphBrandFilter] = useState("all");
  const [manualCosts, setManualCosts] = useState({
    packaging: 0,
    ads: 0,
    sellerShipping: 0,
    other: 0,
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [dateFrom, dateTo, status]);

  const dailyChartRows = useMemo(() => [...(report?.daily || [])].reverse(), [report?.daily]);
  const profitComparisonAllRows = useMemo(() => {
    const rowsByProduct = new Map<
      string,
      {
        productId: string;
        title: string;
        expectedProfit: number;
        expectedRevenue: number;
        realProfit: number;
        realRevenue: number;
        manufacturer: string;
        categoryId: string;
        categoryName: string;
        merchantId: string;
        merchantName: string;
      }
    >();

    for (const product of report?.expected.products || []) {
      rowsByProduct.set(product.productId, {
        productId: product.productId,
        title: product.title,
        expectedProfit: Number(product.expectedProfit || 0),
        expectedRevenue: Number(product.expectedRevenue || 0),
        realProfit: 0,
        realRevenue: 0,
        manufacturer: product.manufacturer || "",
        categoryId: product.categoryId || "",
        categoryName: product.categoryName || "Uncategorized",
        merchantId: product.merchantId || "",
        merchantName: product.merchantName || "No merchant",
      });
    }

    for (const product of report?.products || []) {
      const current = rowsByProduct.get(product.productId) || {
        productId: product.productId,
        title: product.title,
        expectedProfit: 0,
        expectedRevenue: 0,
        realProfit: 0,
        realRevenue: 0,
        manufacturer: product.manufacturer || "",
        categoryId: product.categoryId || "",
        categoryName: product.categoryName || "Uncategorized",
        merchantId: product.merchantId || "",
        merchantName: product.merchantName || "No merchant",
      };

      current.realProfit = Number(product.estimatedProfit || 0);
      current.realRevenue = Number(product.estimatedRevenue || 0);
      current.title = current.title || product.title;
      current.manufacturer = current.manufacturer || product.manufacturer || "";
      current.categoryId = current.categoryId || product.categoryId || "";
      current.categoryName = current.categoryName || product.categoryName || "Uncategorized";
      current.merchantId = current.merchantId || product.merchantId || "";
      current.merchantName = current.merchantName || product.merchantName || "No merchant";
      rowsByProduct.set(product.productId, current);
    }

    return Array.from(rowsByProduct.values())
      .filter((row) => selectedGraphProductIds.includes(row.productId))
      .sort((first, second) =>
        profitChartMode === "expected"
          ? second.expectedProfit - first.expectedProfit
          : second.realProfit - first.realProfit
      )
      .slice(0, 10)
      .reverse();
  }, [profitChartMode, report?.expected.products, report?.products, selectedGraphProductIds]);
  const graphProductOptions = useMemo(() => {
    const optionMap = new Map<
      string,
      {
        productId: string;
        title: string;
        manufacturer: string;
        categoryId: string;
        categoryName: string;
        merchantId: string;
        merchantName: string;
      }
    >();

    for (const product of report?.expected.products || []) {
      optionMap.set(product.productId, {
        productId: product.productId,
        title: product.title,
        manufacturer: product.manufacturer || "",
        categoryId: product.categoryId || "",
        categoryName: product.categoryName || "Uncategorized",
        merchantId: product.merchantId || "",
        merchantName: product.merchantName || "No merchant",
      });
    }

    for (const product of report?.products || []) {
      const current = optionMap.get(product.productId);
      optionMap.set(product.productId, {
        productId: product.productId,
        title: current?.title || product.title,
        manufacturer: current?.manufacturer || product.manufacturer || "",
        categoryId: current?.categoryId || product.categoryId || "",
        categoryName: current?.categoryName || product.categoryName || "Uncategorized",
        merchantId: current?.merchantId || product.merchantId || "",
        merchantName: current?.merchantName || product.merchantName || "No merchant",
      });
    }

    return Array.from(optionMap.values())
      .filter((product) => graphCategoryFilter === "all" || product.categoryId === graphCategoryFilter)
      .filter((product) => graphMerchantFilter === "all" || product.merchantId === graphMerchantFilter)
      .filter((product) => graphBrandFilter === "all" || product.manufacturer === graphBrandFilter)
      .sort((first, second) => first.title.localeCompare(second.title));
  }, [
    graphBrandFilter,
    graphCategoryFilter,
    graphMerchantFilter,
    report?.expected.products,
    report?.products,
  ]);
  const graphCategoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const product of [...(report?.expected.products || []), ...(report?.products || [])]) {
      if (product.categoryId) options.set(product.categoryId, product.categoryName || "Uncategorized");
    }
    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [report?.expected.products, report?.products]);
  const graphMerchantOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const product of [...(report?.expected.products || []), ...(report?.products || [])]) {
      if (product.merchantId) options.set(product.merchantId, product.merchantName || "No merchant");
    }
    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [report?.expected.products, report?.products]);
  const graphBrandOptions = useMemo(() => {
    return Array.from(
      new Set(
        [...(report?.expected.products || []), ...(report?.products || [])]
          .map((product) => product.manufacturer)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [report?.expected.products, report?.products]);
  const manualDeductionTotal = useMemo(
    () =>
      Object.values(manualCosts).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0),
    [manualCosts]
  );
  const netGrossProfit = Number(report?.summary.grossProfit || 0) - manualDeductionTotal;
  const netExpectedProfit = Number(report?.expected.profit || 0) - manualDeductionTotal;

  const updateManualCost = (key: keyof typeof manualCosts, value: string) => {
    setManualCosts((current) => ({
      ...current,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };

  const toggleGraphProduct = (productId: string) => {
    setSelectedGraphProductIds((current) =>
      current.includes(productId)
        ? current.filter((currentId) => currentId !== productId)
        : [...current, productId]
    );
  };

  const selectVisibleGraphProducts = () => {
    setSelectedGraphProductIds((current) => [
      ...new Set([...current, ...graphProductOptions.map((product) => product.productId)]),
    ]);
  };

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
            Profit uses merchandise revenue only, so delivery fees are not counted. Product revenue rows are estimates because old order items do not store sold unit price snapshots.
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

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Expected sales</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(report?.expected.revenue || 0)}</p>
            <p className="mt-1 text-xs text-[var(--site-muted)]">Current in-stock value</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Expected cost</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(report?.expected.cogs || 0)}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Expected winnings</p>
            <p className="mt-2 text-3xl font-bold text-[var(--site-accent)]">{formatMoney(report?.expected.profit || 0)}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-sm text-[var(--site-muted)]">Expected net</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(netExpectedProfit)}</p>
            <p className="mt-1 text-xs text-[var(--site-muted)]">After manual deductions</p>
          </div>
        </div>

        <section className={`${cardClassName} mt-6`}>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Manual deductions</h2>
            <p className="text-sm text-[var(--site-muted)]">
              Add costs paid by you only. Delivery company fees are already excluded from sales.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm font-semibold text-[var(--site-muted)]">
              Packaging
              <input
                type="number"
                min="0"
                value={manualCosts.packaging}
                onChange={(event) => updateManualCost("packaging", event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[var(--site-muted)]">
              Ads
              <input
                type="number"
                min="0"
                value={manualCosts.ads}
                onChange={(event) => updateManualCost("ads", event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[var(--site-muted)]">
              Shipping you paid
              <input
                type="number"
                min="0"
                value={manualCosts.sellerShipping}
                onChange={(event) => updateManualCost("sellerShipping", event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[var(--site-muted)]">
              Other
              <input
                type="number"
                min="0"
                value={manualCosts.other}
                onChange={(event) => updateManualCost("other", event.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <p className="text-sm text-[var(--site-muted)]">Manual deductions</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(manualDeductionTotal)}</p>
            </div>
            <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <p className="text-sm text-[var(--site-muted)]">Net sold profit</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(netGrossProfit)}</p>
            </div>
            <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <p className="text-sm text-[var(--site-muted)]">Net expected winnings</p>
              <p className="mt-1 text-2xl font-bold text-[var(--site-accent)]">{formatMoney(netExpectedProfit)}</p>
            </div>
          </div>
        </section>

        <section className={`${cardClassName} mt-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Graph products</h2>
              <p className="mt-1 text-sm text-[var(--site-muted)]">
                Select products to show in the expected vs real graph.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectVisibleGraphProducts}
                className="min-h-10 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
              >
                Select visible
              </button>
              <button
                type="button"
                onClick={() => setSelectedGraphProductIds([])}
                className="min-h-10 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
              >
                Deselect all
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={graphCategoryFilter}
              onChange={(event) => setGraphCategoryFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="all">All categories</option>
              {graphCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={graphMerchantFilter}
              onChange={(event) => setGraphMerchantFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="all">All merchants</option>
              {graphMerchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
            <select
              value={graphBrandFilter}
              onChange={(event) => setGraphBrandFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="all">All brands</option>
              {graphBrandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {graphProductOptions.length > 0 ? (
              graphProductOptions.map((product) => (
                <label
                  key={product.productId}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-sm font-semibold text-[var(--site-text)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedGraphProductIds.includes(product.productId)}
                    onChange={() => toggleGraphProduct(product.productId)}
                    className="h-4 w-4 shrink-0 accent-[var(--site-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{sanitize(product.title)}</span>
                    <span className="block truncate text-xs text-[var(--site-muted)]">
                      {sanitize(product.categoryName)} | {sanitize(product.merchantName)}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-[var(--site-muted)]">No products available for the graph.</p>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ReportChart
            title="Daily profit graph"
            labels={dailyChartRows.map((row) => row.date)}
            datasets={[
              { label: "Revenue", data: dailyChartRows.map((row) => row.revenue), color: "#d90429" },
              { label: "COGS", data: dailyChartRows.map((row) => row.cogs), color: "#6b7280" },
              { label: "Profit", data: dailyChartRows.map((row) => row.profit), color: "#047857" },
            ]}
          />
          <ReportChart
            title={profitChartMode === "expected" ? "Expected vs real winnings" : "Real sales until now"}
            labels={profitComparisonAllRows.map((row) => sanitize(row.title).slice(0, 18))}
            datasets={[
              {
                label: "Expected profit",
                data: profitComparisonAllRows.map((row) => row.expectedProfit),
                color: "#047857",
              },
              {
                label: "Real sold profit",
                data: profitComparisonAllRows.map((row) => row.realProfit),
                color: "#d90429",
              },
            ]}
            type="bar"
            actions={
              <>
                {(["expected", "real"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setProfitChartMode(mode)}
                    className={`min-h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                      profitChartMode === mode
                        ? "border-[var(--site-accent)] bg-[var(--site-accent)] text-white"
                        : "border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    }`}
                  >
                    {mode === "expected" ? "Expected" : "Real sales until now"}
                  </button>
                ))}
              </>
            }
          />
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

        <section className={`${cardClassName} mt-6`}>
          <h2 className="text-2xl font-semibold">Expected product winnings</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.08em] text-[var(--site-muted)]">
                <tr>
                  <th className="py-3">Product</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">Expected sales</th>
                  <th className="py-3">Expected winnings</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={6}>Loading...</td></tr>
                ) : report?.expected.products.length ? (
                  report.expected.products.map((row) => (
                    <tr key={row.productId} className="border-t border-[var(--site-border)]">
                      <td className="py-3">
                        <p className="font-semibold">{sanitize(row.title)}</p>
                        <p className="text-xs text-[var(--site-muted)]">{sanitize(row.sku || "-")}</p>
                      </td>
                      <td className="py-3">{row.quantity}</td>
                      <td className="py-3">{formatMoney(row.unitPrice)}</td>
                      <td className="py-3">{formatMoney(row.unitCost)}</td>
                      <td className="py-3">{formatMoney(row.expectedRevenue)}</td>
                      <td className="py-3 font-semibold text-[var(--site-accent)]">{formatMoney(row.expectedProfit)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="py-6 text-[var(--site-muted)]" colSpan={6}>No expected stock data found.</td></tr>
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
