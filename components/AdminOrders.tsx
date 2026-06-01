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
import Link from "next/link";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

interface OrderStatusOption {
  id: string;
  code: string;
  name: string;
  groupCode: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await apiClient.get("/api/orders");
      const data = await response.json();
      
      setOrders(data?.orders);
    };

    const fetchStatuses = async () => {
      const response = await apiClient.get("/api/order-statuses");
      const data = await response.json();
      setStatusOptions(data?.statuses || []);
    };

    fetchOrders();
    fetchStatuses();
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
        throw new Error(errorData.details || "Failed to update order status");
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

  return (
    <div className="xl:ml-5 w-full max-xl:mt-5 ">
      <h1 className="text-3xl font-semibold text-center mb-5">All orders</h1>
      <div className="overflow-x-auto">
        <table className="table table-md table-pin-cols">
          {/* head */}
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>Order ID</th>
              <th>Name and country</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            {orders && orders.length > 0 &&
              orders.map((order) => (
                <tr key={order?.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>

                  <td>
                    <div>
                      <p className="font-bold">
                        #{order?.orderNumber || order?.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[var(--site-muted)]">{order?.id}</p>
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-5">
                      <div>
                        <div className="font-bold">{order?.name}</div>
                        <div className="text-sm opacity-50">{order?.country}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <select
                      className="select select-bordered select-sm min-w-40"
                      value={order?.status}
                      onChange={(event) => updateOrderStatus(order, event.target.value)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.id} value={status.code}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <p>${order?.total}</p>
                  </td>

                  <td>{ new Date(Date.parse(order?.dateTime)).toDateString() }</td>
                  <th>
                    <Link
                      href={`/admin/orders/${order?.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      details
                    </Link>
                  </th>
                </tr>
              ))}
          </tbody>
          {/* foot */}
          <tfoot>
            <tr>
              <th></th>
              <th>Order ID</th>
              <th>Name and country</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Date</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
