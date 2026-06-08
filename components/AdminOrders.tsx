"use client";

// *********************
// Role of the component: Component that displays all orders on admin dashboard page
// Name of the component: AdminOrders.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <AdminOrders />
// Input parameters: No input parameters
// Output: Table with all orders
// *********************

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import DataTable, { DataTableColumn } from "./ui/DataTable";
import ViewActionLink from "./ui/ViewActionLink";

interface OrderStatusOption {
  id: string;
  code: string;
  name: string;
  groupCode: string;
}

const formatOrderDate = (value: string) => {
  const date = new Date(Date.parse(value));

  if (Number.isNaN(date.getTime())) {
    return { dateLabel: "-", timeLabel: "" };
  }

  return {
    dateLabel: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    timeLabel: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const getApiErrorMessage = (errorData: any, fallback: string) => {
  if (typeof errorData?.details === "string" && errorData.details.trim()) {
    return errorData.details;
  }

  if (Array.isArray(errorData?.details) && errorData.details.length > 0) {
    return errorData.details
      .map((detail: any) => detail?.message || detail?.field || JSON.stringify(detail))
      .join(", ");
  }

  if (errorData?.details && typeof errorData.details === "object") {
    return errorData.details.message || JSON.stringify(errorData.details);
  }

  if (typeof errorData?.error === "string" && errorData.error.trim()) {
    return errorData.error;
  }

  return fallback;
};

const readApiResponse = async (response: Response, fallback: string) => {
  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallback));
  }

  return data;
};

const ORDER_SORT_OPTIONS = [
  { label: "Newest first", value: "date:desc" },
  { label: "Oldest first", value: "date:asc" },
  { label: "Subtotal high to low", value: "total:desc" },
  { label: "Subtotal low to high", value: "total:asc" },
  { label: "Order number high to low", value: "orderNumber:desc" },
  { label: "Order number low to high", value: "orderNumber:asc" },
  { label: "Customer A-Z", value: "customer:asc" },
  { label: "Customer Z-A", value: "customer:desc" },
  { label: "Status A-Z", value: "status:asc" },
  { label: "Status Z-A", value: "status:desc" },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusGroupFilter, setStatusGroupFilter] = useState("all");
  const [minTotalFilter, setMinTotalFilter] = useState("");
  const [maxTotalFilter, setMaxTotalFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [sortValue, setSortValue] = useState("date:desc");
  const deferredSearch = useDeferredValue(search);

  const statusGroups = useMemo(
    () =>
      Array.from(
        new Map(
          statusOptions.map((status) => [
            status.groupCode,
            { code: status.groupCode, name: status.groupCode.replace(/-/g, " ") },
          ])
        ).values()
      ),
    [statusOptions]
  );

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statusesResponse = await apiClient.get("/api/order-statuses");
        const statusesData = await readApiResponse(
          statusesResponse,
          "Failed to load order statuses from the backend"
        );

        setStatusOptions(statusesData?.statuses || []);
      } catch (error) {
        console.error("Failed to load order statuses:", error);
        toast.error(
          error instanceof TypeError
            ? "Backend is not reachable"
            : error instanceof Error
              ? error.message
              : "Failed to load order statuses"
        );
      }
    };

    fetchStatuses();
  }, []);

  useEffect(() => {
    const [sortBy, sortDirection] = sortValue.split(":");

    const fetchOrders = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("limit", "200");
        params.set("sortBy", sortBy || "date");
        params.set("sortDirection", sortDirection || "desc");

        if (deferredSearch.trim()) {
          params.set("search", deferredSearch.trim());
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        if (statusGroupFilter !== "all") {
          params.set("statusGroup", statusGroupFilter);
        }

        if (minTotalFilter.trim()) {
          params.set("minTotal", minTotalFilter.trim());
        }

        if (maxTotalFilter.trim()) {
          params.set("maxTotal", maxTotalFilter.trim());
        }

        if (dateFromFilter) {
          params.set("dateFrom", dateFromFilter);
        }

        if (dateToFilter) {
          params.set("dateTo", dateToFilter);
        }

        const ordersResponse = await apiClient.get(`/api/orders?${params.toString()}`);
        const ordersData = await readApiResponse(
          ordersResponse,
          "Failed to load orders from the backend"
        );

        setOrders(ordersData?.orders || []);
      } catch (error) {
        console.error("Failed to load orders:", error);
        toast.error(
          error instanceof TypeError
            ? "Backend is not reachable"
            : error instanceof Error
              ? error.message
              : "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [
    dateFromFilter,
    dateToFilter,
    deferredSearch,
    maxTotalFilter,
    minTotalFilter,
    sortValue,
    statusFilter,
    statusGroupFilter,
  ]);

  const updateOrderStatus = async (order: Order, status: string) => {
    const previousStatus = order.status;

    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id ? { ...currentOrder, status } : currentOrder
      )
    );

    try {
      const response = await apiClient.put(`/api/orders/${order.id}`, {
        ...order,
        status,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getApiErrorMessage(errorData, "Failed to update order status"));
      }

      const updatedOrder = await response.json();
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? { ...currentOrder, ...updatedOrder } : currentOrder
        )
      );
      toast.success("Order status updated");
    } catch (error: any) {
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: previousStatus }
            : currentOrder
        )
      );
      toast.error(error?.message || "Failed to update order status");
    }
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order",
      searchableText: (order) => `${order.orderNumber || ""} ${order.id}`,
      cell: (order) => (
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{order.orderNumber || order.id.slice(0, 8)}</p>
          {(order.failedHistoryCount || 0) > 0 && (
            <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
              F: {order.failedHistoryCount}
            </span>
          )}
          {(order.cancelledHistoryCount || 0) > 0 && (
            <span className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
              C: {order.cancelledHistoryCount}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      searchableText: (order) => `${order.name} ${order.lastname}`,
      cell: (order) => (
        <div>
          <div className="font-bold">{order.name}</div>
          <div className="text-sm text-[var(--site-muted)]">{order.lastname}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      select: {
        value: (order) => order.status,
        options: statusOptions.map((status) => ({
          label: status.name,
          value: status.code,
        })),
        onChange: updateOrderStatus,
        className: "min-w-40",
      },
    },
    {
      key: "total",
      header: "Subtotal",
      accessor: (order) => `$${order.total}`,
    },
    {
      key: "date",
      header: "Date",
      cell: (order) => {
        const { dateLabel, timeLabel } = formatOrderDate(order.dateTime);

        return (
          <div className="text-center">
            <div className="font-medium">{dateLabel}</div>
            {timeLabel && (
              <div className="text-xs text-[var(--site-muted)]">{timeLabel}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (order) => (
        <ViewActionLink href={`/admin/orders/${order.id}`} label="View order details" />
      ),
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStatusGroupFilter("all");
    setMinTotalFilter("");
    setMaxTotalFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setSortValue("date:desc");
  };

  return (
    <DataTable
      title="All orders"
      data={orders}
      columns={columns}
      getRowId={(order) => order.id}
      loading={loading}
      emptyMessage="No orders found."
      enableSelection
      enableSearch
      searchValue={search}
      onSearchChange={setSearch}
      autoFilter={false}
      searchPlaceholder="Search by order number or customer..."
      className="w-full xl:ml-5 max-xl:mt-5"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-10 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status.id} value={status.code}>
                {status.name}
              </option>
            ))}
          </select>
          <select
            value={statusGroupFilter}
            onChange={(event) => setStatusGroupFilter(event.target.value)}
            className="min-h-10 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          >
            <option value="all">All groups</option>
            {statusGroups.map((group) => (
              <option key={group.code} value={group.code}>
                {group.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={minTotalFilter}
            onChange={(event) => setMinTotalFilter(event.target.value)}
            placeholder="Min subtotal"
            className="min-h-10 w-28 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          />
          <input
            type="number"
            min="0"
            value={maxTotalFilter}
            onChange={(event) => setMaxTotalFilter(event.target.value)}
            placeholder="Max subtotal"
            className="min-h-10 w-28 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          />
          <input
            type="date"
            value={dateFromFilter}
            onChange={(event) => setDateFromFilter(event.target.value)}
            className="min-h-10 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          />
          <input
            type="date"
            value={dateToFilter}
            onChange={(event) => setDateToFilter(event.target.value)}
            className="min-h-10 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          />
          <select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
            className="min-h-10 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
          >
            {ORDER_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-10 rounded-md border border-[var(--site-border)] px-3 text-sm font-semibold transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
          >
            Reset
          </button>
          <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            Orders: {orders.length}
          </span>
        </div>
      }
    />
  );
};

export default AdminOrders;
