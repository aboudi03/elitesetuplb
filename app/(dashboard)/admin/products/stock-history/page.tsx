"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ProductStockHistoryRow {
  id: string;
  productId: string;
  customerOrderId?: string | null;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  reason: string;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    mainImage: string;
    slug: string;
  } | null;
  order?: {
    id: string;
    orderNumber?: number | null;
    name: string;
    lastname: string;
  } | null;
}

const ProductStockHistoryPage = () => {
  const [history, setHistory] = useState<ProductStockHistoryRow[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get("/api/orders/history/stock");
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load product stock history");
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-screen-2xl justify-start bg-[var(--site-bg)] text-[var(--site-text)] max-xl:h-fit max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:mt-5">
        <h1 className="mb-5 text-center text-3xl font-semibold">Product Stock History</h1>
        <div className="overflow-x-auto">
          <table className="table table-md">
            <thead>
              <tr>
                <th>Product</th>
                <th>Order</th>
                <th>Stock change</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.product?.mainImage ? `/${item.product.mainImage}` : "/product_placeholder.jpg"}
                        alt={item.product?.title || "Product"}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-md object-contain"
                      />
                      <div>
                        <p className="font-semibold">{item.product?.title || "Unknown product"}</p>
                        <p className="text-xs text-[var(--site-muted)]">{item.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.customerOrderId ? (
                      <Link
                        href={`/admin/orders/${item.customerOrderId}`}
                        className="font-bold text-[var(--site-accent)]"
                      >
                        #{item.order?.orderNumber || item.customerOrderId.slice(0, 8)}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <p className="font-semibold">
                      {item.quantityChange > 0 ? "+" : ""}
                      {item.quantityChange}
                    </p>
                    <p className="text-xs text-[var(--site-muted)]">
                      {item.previousStock} to {item.newStock}
                    </p>
                  </td>
                  <td>{item.reason}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <p className="p-5 text-sm text-[var(--site-muted)]">No product stock history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductStockHistoryPage;
