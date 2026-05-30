"use client";
import React, { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";

interface Merchant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  status: string;
  products: any[];
}

export default function MerchantPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/merchants");
      if (!response.ok) {
        throw new Error("Failed to fetch merchants");
      }
      const data = await response.json();
      setMerchants(data);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <div className="flex min-h-screen flex-col xl:flex-row">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-10">
        <div className="mb-6 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <h1 className="text-3xl font-bold max-sm:text-2xl">Merchants</h1>
          <Link
            href="/admin/merchant/new"
            className="rounded-md bg-[var(--site-accent)] px-6 py-2 text-center text-white transition hover:bg-[var(--site-accent-strong)]"
          >
            Add Merchant
          </Link>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          {loading ? (
            <div className="text-center py-10">Loading merchants...</div>
          ) : merchants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 text-left">Name</th>
                    <th className="px-3 py-3 text-left">Email</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-left">Products</th>
                    <th className="px-3 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-4">{merchant.name}</td>
                      <td className="px-3 py-4">{merchant.email || "N/A"}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            merchant.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {merchant.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">{merchant.products.length}</td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/admin/merchant/${merchant.id}`}
                          className="mr-3 text-[var(--site-accent)] hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/merchant/${merchant.id}`}
                          className="text-[var(--site-accent)] hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">No merchants found</div>
          )}
        </div>
      </div>
    </div>
  );
}
