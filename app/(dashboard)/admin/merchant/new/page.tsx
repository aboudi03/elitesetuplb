"use client";
import React, { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";

export default function NewMerchantPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    status: "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Merchant name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post("/api/merchants", formData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create merchant");
      }

      const data = await response.json();
      toast.success("Merchant created successfully");
      router.push(`/admin/merchant/${data.id}`);
    } catch (error) {
      console.error("Error creating merchant:", error);
      toast.error("Failed to create merchant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col xl:flex-row">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-10">
        <div className="mb-6 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <h1 className="text-3xl font-bold max-sm:text-2xl">Add New Merchant</h1>
          <Link
            href="/admin/merchant"
            className="rounded-md bg-gray-500 px-6 py-2 text-center text-white transition hover:bg-gray-600"
          >
            Cancel
          </Link>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)]"
                placeholder="Merchant name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)]"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)]"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)]"
                placeholder="Merchant address"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-[var(--site-accent)] h-32"
                placeholder="Enter merchant description"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`rounded-md bg-[var(--site-accent)] px-6 py-2 text-white transition hover:bg-[var(--site-accent-strong)] max-sm:w-full ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Creating..." : "Create Merchant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
