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
  productId: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    mainImage: string;
    price: number;
    rating: number;
    description: string;
    manufacturer: string;
    inStock: number;
    categoryId: string;
  };
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

  useEffect(() => {
    const fetchOrderData = async () => {
      const response = await apiClient.get(
        `/api/orders/${params?.id}`
      );
      const data: Order & {
        statusHistory?: StatusHistoryItem[];
        stockHistory?: StockHistoryItem[];
      } = await response.json();
      setOrder(data);
      setStatusHistory(data.statusHistory || []);
      setStockHistory(data.stockHistory || []);
    };

    const fetchOrderProducts = async () => {
      const response = await apiClient.get(
        `/api/order-product/${params?.id}`
      );
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

      apiClient.put(`/api/orders/${order?.id}`, order)
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

    apiClient.delete(
      `/api/order-product/${order?.id}`,
      requestOptions
    ).then((response) => {
      apiClient.delete(
        `/api/orders/${order?.id}`,
        requestOptions
      ).then((response) => {
        toast.success("Order deleted successfully");
        router.push("/admin/orders");
      });
    });
  };

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)] flex justify-start max-w-screen-2xl mx-auto xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />
      <div className="flex flex-col gap-y-7 xl:ml-5 w-full max-xl:px-5">
        <h1 className="text-3xl font-semibold">Order details</h1>
        <div className="mt-5">
          <label className="w-full">
            <div>
              <span className="text-xl font-bold">Order number:</span>
              <span className="text-base"> #{order?.orderNumber || order?.id.slice(0, 8)}</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-bold text-[var(--site-muted)]">Internal ID:</span>
              <span className="text-sm text-[var(--site-muted)]"> {order?.id}</span>
            </div>
          </label>
        </div>
        <div className="flex gap-x-2 max-sm:flex-col">
          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Name:</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                value={order?.name}
                onChange={(e) => setOrder({ ...order, name: e.target.value })}
              />
            </label>
          </div>
          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Lastname:</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                value={order?.lastname}
                onChange={(e) =>
                  setOrder({ ...order, lastname: e.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Phone number:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={order?.phone}
              onChange={(e) => setOrder({ ...order, phone: e.target.value })}
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Email adress:</span>
            </div>
            <input
              type="email"
              className="input input-bordered w-full max-w-xs"
              value={order?.email}
              onChange={(e) => setOrder({ ...order, email: e.target.value })}
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Company (optional):</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={order?.company}
              onChange={(e) => setOrder({ ...order, company: e.target.value })}
            />
          </label>
        </div>

        <div className="flex gap-x-2 max-sm:flex-col">
          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Address:</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                value={order?.adress}
                onChange={(e) => setOrder({ ...order, adress: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Apartment, suite, etc. :</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                value={order?.apartment}
                onChange={(e) =>
                  setOrder({ ...order, apartment: e.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="flex gap-x-2 max-sm:flex-col">
          <div>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">City:</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full max-w-xs"
                value={order?.city}
                onChange={(e) => setOrder({ ...order, city: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Order status</span>
            </div>
            <select
              className="select select-bordered"
              value={order?.status}
              onChange={(e) =>
                setOrder({
                  ...order,
                  status: e.target.value,
                })
              }
            >
              {statusOptions.map((status) => (
                <option key={status.id} value={status.code}>
                  {status.name} ({status.groupCode})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label className="form-control">
            <div className="label">
              <span className="label-text">Order notice:</span>
            </div>
            <textarea
              className="textarea textarea-bordered h-24"
              value={order?.orderNotice || ""}
              onChange={(e) =>
                setOrder({ ...order, orderNotice: e.target.value })
              }
            ></textarea>
          </label>
        </div>
        <div>
          {orderProducts?.map((product) => (
            <div className="flex items-center gap-x-4" key={product?.id}>
              <Image
                src={product?.product?.mainImage ? `/${product?.product?.mainImage}` : "/product_placeholder.jpg"}
                alt={product?.product?.title}
                width={50}
                height={50}
                className="w-auto h-auto"
              />
              <div>
                <Link href={`/product/${product?.product?.slug}`}>
                  {product?.product?.title}
                </Link>
                <p>
                  ${product?.product?.price} * {product?.quantity} items
                </p>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-y-2 mt-10">
            <p className="text-2xl">Subtotal: ${order?.total}</p>
            <p className="text-2xl">Tax 20%: ${order?.total / 5}</p>
            <p className="text-2xl">Shipping: $5</p>
            <p className="text-3xl font-semibold">
              Total: ${order?.total + order?.total / 5 + 5}
            </p>
          </div>
          <div className="flex gap-x-2 max-sm:flex-col mt-5">
            <button
              type="button"
              className="uppercase bg-[var(--site-accent)] px-10 py-5 text-lg border border-black border-gray-300 font-bold text-white shadow-sm hover:bg-[var(--site-accent-strong)] hover:text-white focus:outline-none focus:ring-2"
              onClick={updateOrder}
            >
              Update order
            </button>
            <button
              type="button"
              className="uppercase bg-red-600 px-10 py-5 text-lg border border-black border-gray-300 font-bold text-white shadow-sm hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2"
              onClick={deleteOrder}
            >
              Delete order
            </button>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-4">
              <h2 className="text-xl font-semibold">Order status history</h2>
              <div className="mt-4 space-y-3">
                {statusHistory.length > 0 ? (
                  statusHistory.map((item) => (
                    <div key={item.id} className="text-sm text-[var(--site-muted)]">
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

            <section className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-4">
              <h2 className="text-xl font-semibold">Product stock history</h2>
              <div className="mt-4 space-y-3">
                {stockHistory.length > 0 ? (
                  stockHistory.map((item) => (
                    <div key={item.id} className="text-sm text-[var(--site-muted)]">
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

