"use client";
import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { isValidEmailAddressFormat, isValidNameOrLastname } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface OrderProduct {
  id: string;
  customerOrderId: string;
  productId: string | null;
  quantity: number;
  selectedColor?: string | null;
  product: {
    id: string;
    slug: string | null;
    title: string;
    mainImage: string | null;
    price: number;
    model?: string | null;
    rating?: number;
    description?: string | null;
    manufacturer?: string | null;
    inStock?: number;
    categoryId?: string | null;
  } | null;
}

interface OrderStatusOption {
  id: string;
  code: string;
  name: string;
  groupCode: string;
}

interface StatusHistoryItem {
  id: string;
  previousStatus?: string;
  newStatus: string;
  previousGroupCode?: string;
  newGroupCode: string;
  note?: string;
  createdAt: string;
}

interface StockHistoryItem {
  id: string;
  productId: string;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

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

const AdminSingleOrder = () => {
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>();
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>([]);
  const [order, setOrder] = useState<Order>({
    id: "",
    adress: "",
    apartment: "",
    company: "",
    dateTime: "",
    email: "",
    lastname: "",
    name: "",
    phone: "",
    city: "",
    orderNotice: "",
    status: "processing",
    total: 0,
  });
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const fieldClassName =
    "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
  const sectionClassName =
    "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";

  useEffect(() => {
    const fetchOrderData = async () => {
      const response = await apiClient.get(`/api/orders/${params?.id}`);
      const data: Order & {
        statusHistory?: StatusHistoryItem[];
        stockHistory?: StockHistoryItem[];
      } = await response.json();
      setOrder(data);
      setStatusHistory(data.statusHistory || []);
      setStockHistory(data.stockHistory || []);
    };

    const fetchOrderProducts = async () => {
      const response = await apiClient.get(`/api/order-product/${params?.id}`);
      const data: OrderProduct[] = await response.json();
      setOrderProducts(data);
    };

    const fetchOrderStatuses = async () => {
      const response = await apiClient.get("/api/order-statuses");
      const data = await response.json();
      setStatusOptions(data?.statuses || []);
    };

    fetchOrderData();
    fetchOrderProducts();
    fetchOrderStatuses();
  }, [params?.id]);

  const updateOrder = async () => {
    if (
      order?.name.length > 0 &&
      order?.lastname.length > 0 &&
      order?.phone.length > 0 &&
      order?.email.length > 0 &&
      order?.adress.length > 0 &&
      order?.city.length > 0
    ) {
      if (!isValidNameOrLastname(order?.name)) {
        toast.error("You entered invalid name format");
        return;
      }

      if (!isValidNameOrLastname(order?.lastname)) {
        toast.error("You entered invalid lastname format");
        return;
      }

      if (!isValidEmailAddressFormat(order?.email)) {
        toast.error("You entered invalid email format");
        return;
      }

      apiClient
        .put(`/api/orders/${order?.id}`, order)
        .then(async (response) => {
          if (response.status === 200) {
            const updatedOrder = await response.json();
            setOrder(updatedOrder);
            setStatusHistory(updatedOrder.statusHistory || statusHistory);
            setStockHistory(updatedOrder.stockHistory || stockHistory);
            toast.success("Order updated successfuly");
          } else {
            const errorData = await response.json();
            throw Error(getApiErrorMessage(errorData, "There was an error while updating a order"));
          }
        })
        .catch((error) =>
          toast.error(error.message || "There was an error while updating a order")
        );
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const deleteOrder = async () => {
    const requestOptions = {
      method: "DELETE",
    };

    apiClient.delete(`/api/order-product/${order?.id}`, requestOptions).then(() => {
      apiClient.delete(`/api/orders/${order?.id}`, requestOptions).then(() => {
        toast.success("Order deleted successfully");
        router.push("/admin/orders");
      });
    });
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
                Orders
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Order {order?.orderNumber || order?.id.slice(0, 8)}
              </h1>
              <p className="mt-3 text-base text-[var(--site-muted)]">
                Review customer information, update status, and track fulfillment activity in a cleaner workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-4 text-sm text-[var(--site-muted)] shadow-sm">
              <p>
                <span className="font-semibold text-[var(--site-text)]">Internal ID:</span> {order?.id}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-[var(--site-text)]">Placed:</span>{" "}
                {order?.dateTime ? new Date(order.dateTime).toLocaleString() : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Customer details</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Manage contact and delivery information without hunting through a long vertical form.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Name</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.name}
                    onChange={(e) => setOrder({ ...order, name: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Last name</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.lastname}
                    onChange={(e) => setOrder({ ...order, lastname: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Phone number</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.phone}
                    onChange={(e) => setOrder({ ...order, phone: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Email address</span>
                  <input
                    type="email"
                    className={fieldClassName}
                    value={order?.email}
                    onChange={(e) => setOrder({ ...order, email: e.target.value })}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Company</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.company}
                    onChange={(e) => setOrder({ ...order, company: e.target.value })}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Address</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.adress}
                    onChange={(e) => setOrder({ ...order, adress: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Apartment, suite, etc.</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.apartment}
                    onChange={(e) => setOrder({ ...order, apartment: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">City</span>
                  <input
                    type="text"
                    className={fieldClassName}
                    value={order?.city}
                    onChange={(e) => setOrder({ ...order, city: e.target.value })}
                  />
                </label>
              </div>
            </section>

            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Order note</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Save internal context or customer notes directly with the order.
                </p>
              </div>
              <textarea
                className={`${fieldClassName} min-h-[180px]`}
                value={order?.orderNotice || ""}
                onChange={(e) => setOrder({ ...order, orderNotice: e.target.value })}
              />
            </section>
          </div>

          <div className="space-y-6">
            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Order control</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Change status, confirm totals, and apply updates from one focused panel.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Order status</span>
                  <select
                    className={fieldClassName}
                    value={order?.status}
                    onChange={(e) => setOrder({ ...order, status: e.target.value })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.code}>
                        {status.name} ({status.groupCode})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-5">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-[var(--site-muted)]">Subtotal</span>
                    <span className="font-semibold">${order?.total}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-base">
                    <span className="text-[var(--site-muted)]">Tax</span>
                    <span className="font-semibold">Calculated per product at checkout</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-base">
                    <span className="text-[var(--site-muted)]">Shipping</span>
                    <span className="font-semibold">$5</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--site-border)] pt-4 text-lg">
                    <span className="font-semibold">Estimated total</span>
                    <span className="text-2xl font-semibold">${order?.total + 5}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[var(--site-accent)] px-8 text-base font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[var(--site-accent-strong)] focus:outline-none focus:ring-2"
                    onClick={updateOrder}
                  >
                    Update order
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-14 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2"
                    onClick={deleteOrder}
                  >
                    Delete order
                  </button>
                </div>
              </div>
            </section>

            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Order items</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Review linked products, quantities, and quick storefront access.
                </p>
              </div>

              <div className="space-y-4">
                {orderProducts?.map((product) => (
                  <div
                    className="flex items-center gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4"
                    key={product?.id}
                  >
                    <Image
                      src={product?.product?.mainImage ? `/${product?.product?.mainImage}` : "/product_placeholder.jpg"}
                      alt={product?.product?.title || product?.product?.model || "Deleted product"}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={product?.product?.slug ? `/product/${product.product.slug}` : "#"}
                        className="text-lg font-semibold hover:text-[var(--site-accent)]"
                      >
                        {product?.product?.title || product?.product?.model || "Deleted product"}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--site-muted)]">
                        ${Number(product?.product?.price || 0).toFixed(2)} each
                      </p>
                      {product?.selectedColor && (
                        <p className="mt-1 text-sm text-[var(--site-muted)]">
                          Color: <span className="font-medium text-[var(--site-text)]">{product.selectedColor}</span>
                        </p>
                      )}
                    </div>
                    <div className="rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-1 text-sm font-semibold">
                      x{product?.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-xl font-semibold">Order status history</h2>
              <div className="mt-4 space-y-3">
                {statusHistory.length > 0 ? (
                  statusHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4 text-sm text-[var(--site-muted)]"
                    >
                      <p className="font-medium text-[var(--site-text)]">
                        {item.previousStatus || "none"} to {item.newStatus}
                      </p>
                      <p>
                        {item.previousGroupCode || "none"} to {item.newGroupCode}
                      </p>
                      <p>{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--site-muted)]">No status changes yet.</p>
                )}
              </div>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-xl font-semibold">Product stock history</h2>
              <div className="mt-4 space-y-3">
                {stockHistory.length > 0 ? (
                  stockHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4 text-sm text-[var(--site-muted)]"
                    >
                      <p className="font-medium text-[var(--site-text)]">
                        {item.quantityChange > 0 ? "+" : ""}
                        {item.quantityChange} stock
                      </p>
                      <p>
                        {item.previousStock} to {item.newStock}
                      </p>
                      <p>{item.reason}</p>
                      <p>{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--site-muted)]">No stock changes yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSingleOrder;
