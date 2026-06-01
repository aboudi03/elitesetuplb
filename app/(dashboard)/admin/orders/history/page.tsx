"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

interface OrderStatusHistoryRow {
  id: string;
  customerOrderId: string;
  previousStatus?: string | null;
  newStatus: string;
  previousGroupCode?: string | null;
  newGroupCode: string;
  note?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber?: number | null;
    name: string;
    lastname: string;
    email: string;
  } | null;
}

const OrderStatusHistoryPage = () => {
  const [history, setHistory] = useState<OrderStatusHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get("/api/orders/history/status");
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load order history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const columns: DataTableColumn<OrderStatusHistoryRow>[] = [
    {
      key: "order",
      header: "Order",
      searchableText: (item) =>
        `${item.order?.orderNumber || ""} ${item.customerOrderId} ${item.order?.name || ""} ${item.order?.lastname || ""}`,
      cell: (item) => (
        <Link
          href={`/admin/orders/${item.customerOrderId}`}
          className="font-bold text-[var(--site-accent)]"
        >
          #{item.order?.orderNumber || item.customerOrderId.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (item) => (
        <div>
          <p className="font-medium">
            {item.order ? `${item.order.name} ${item.order.lastname}` : "Unknown"}
          </p>
          <p className="text-xs text-[var(--site-muted)]">{item.order?.email}</p>
        </div>
      ),
    },
    {
      key: "statusChange",
      header: "Status change",
      cell: (item) => (
        <span>
          {item.previousStatus || "none"} to <span className="font-semibold">{item.newStatus}</span>
        </span>
      ),
    },
    {
      key: "groupChange",
      header: "Group change",
      cell: (item) => (
        <span>
          {item.previousGroupCode || "none"} to <span className="font-semibold">{item.newGroupCode}</span>
        </span>
      ),
    },
    {
      key: "note",
      header: "Note",
      accessor: (item) => item.note || "-",
    },
    {
      key: "date",
      header: "Date",
      accessor: (item) => new Date(item.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="mx-auto flex h-full max-w-screen-2xl justify-start bg-[var(--site-bg)] text-[var(--site-text)] max-xl:h-fit max-xl:flex-col">
      <DashboardSidebar />
      <DataTable
        title="Order Status History"
        data={history}
        columns={columns}
        getRowId={(item) => item.id}
        loading={loading}
        emptyMessage="No order status history yet."
        enableSearch
        searchPlaceholder="Search by order number..."
        className="w-full xl:ml-5 max-xl:mt-5"
      />
    </div>
  );
};

export default OrderStatusHistoryPage;
