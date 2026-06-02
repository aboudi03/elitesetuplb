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

import React, { useEffect, useState } from "react";
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

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, statusesResponse] = await Promise.all([
          apiClient.get("/api/orders"),
          apiClient.get("/api/order-statuses"),
        ]);
        const ordersData = await ordersResponse.json();
        const statusesData = await statusesResponse.json();

        setOrders(ordersData?.orders || []);
        setStatusOptions(statusesData?.statuses || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      searchPlaceholder="Search by order number or customer..."
      className="w-full xl:ml-5 max-xl:mt-5"
      actions={
        <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          Orders: {orders.length}
        </span>
      }
    />
  );
};

export default AdminOrders;
