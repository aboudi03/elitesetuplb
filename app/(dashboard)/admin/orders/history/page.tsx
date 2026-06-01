"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get("/api/orders/history/status");
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load order history");
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-screen-2xl justify-start bg-[var(--site-bg)] text-[var(--site-text)] max-xl:h-fit max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:mt-5">
        <h1 className="mb-5 text-center text-3xl font-semibold">Order Status History</h1>
        <div className="overflow-x-auto">
          <table className="table table-md">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status change</th>
                <th>Group change</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/admin/orders/${item.customerOrderId}`}
                      className="font-bold text-[var(--site-accent)]"
                    >
                      #{item.order?.orderNumber || item.customerOrderId.slice(0, 8)}
                    </Link>
                  </td>
                  <td>
                    <p className="font-medium">
                      {item.order ? `${item.order.name} ${item.order.lastname}` : "Unknown"}
                    </p>
                    <p className="text-xs text-[var(--site-muted)]">{item.order?.email}</p>
                  </td>
                  <td>
                    <span>{item.previousStatus || "none"}</span>
                    <span className="mx-2">to</span>
                    <span className="font-semibold">{item.newStatus}</span>
                  </td>
                  <td>
                    <span>{item.previousGroupCode || "none"}</span>
                    <span className="mx-2">to</span>
                    <span className="font-semibold">{item.newGroupCode}</span>
                  </td>
                  <td>{item.note || "-"}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <p className="p-5 text-sm text-[var(--site-muted)]">No order status history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHistoryPage;
