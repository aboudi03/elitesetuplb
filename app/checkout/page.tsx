"use client";
export const dynamic = "force-dynamic";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { buildCartAnalyticsItems, trackBeginCheckoutEvent, trackPurchaseEvent } from "@/lib/analytics";
import { calculateCartGrandTotal, calculateCartTax } from "@/lib/cartPricing";
import { pcBuilderWhatsAppNumber } from "@/lib/pc-builder";

const inputClassName =
  "block w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-[var(--site-text)] shadow-sm outline-none focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent)] sm:text-sm disabled:cursor-not-allowed disabled:opacity-60";

const isValidLebanesePhone = (phone: string) =>
  /^(03\d{6}|(?:70|71|76|78|79|81)\d{6})$/.test(phone);

type DeliveryZone = {
  id: string;
  code: string;
  country: string;
  governorate: string;
  city: string;
  label: string;
  fee: number;
};

type CheckoutSuccessSummary = {
  orderId: string;
  orderNumber?: number | null;
  customerName: string;
  items: Array<{
    cartItemId?: string;
    title: string;
    image?: string;
    amount: number;
    price: number;
    selectedColor?: string;
    selectedSize?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
};

type SessionUserWithId = {
  id?: string;
  email?: string | null;
};

const CheckoutPage = () => {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUserWithId | undefined;
  const [isMounted, setIsMounted] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    deliveryZoneId: "",
    orderNotice: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [successSummary, setSuccessSummary] = useState<CheckoutSuccessSummary | null>(null);
  const hasTrackedCheckoutStart = useRef(false);
  const hasCompletedCheckout = useRef(false);
  const cartState = useProductStore();
  const products = Array.isArray(cartState?.products) ? cartState.products : [];
  const total = typeof cartState?.total === "number" ? cartState.total : 0;
  const clearCart = typeof cartState?.clearCart === "function" ? cartState.clearCart : () => undefined;
  const router = useRouter();

  const selectedDeliveryZone = deliveryZones.find(
    (zone) => zone.id === checkoutForm.deliveryZoneId
  );
  const deliveryFee = total === 0 ? 0 : Number(selectedDeliveryZone?.fee || 5);
  const orderTaxTotal = calculateCartTax(products);
  const orderGrandTotal = calculateCartGrandTotal(products, total, deliveryFee);
  const whatsappHref = `https://wa.me/${pcBuilderWhatsAppNumber}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadDeliveryZones = async () => {
      try {
        const response = await apiClient.get("/api/delivery-zones", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.details || data?.error || "Failed to load delivery areas");
        }

        const zones = Array.isArray(data?.zones) ? data.zones : [];
        setDeliveryZones(zones);
        setCheckoutForm((current) => {
          if (current.deliveryZoneId || zones.length === 0) return current;
          const standardZone =
            zones.find((zone: DeliveryZone) => zone.code === "standard-lebanon") || zones[0];
          return {
            ...current,
            deliveryZoneId: standardZone.id,
            city: standardZone.city,
          };
        });
      } catch (error: any) {
        toast.error(error?.message || "Failed to load delivery areas");
      }
    };

    loadDeliveryZones();
  }, []);

  useEffect(() => {
    if (!isMounted || hasTrackedCheckoutStart.current || products.length === 0 || total <= 0) {
      return;
    }

    trackBeginCheckoutEvent({
      value: total,
      items: buildCartAnalyticsItems(products),
    });
    hasTrackedCheckoutStart.current = true;
  }, [isMounted, products, total]);

  const normalizeLebanesePhone = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("00")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("961")) {
      digits = digits.slice(3);
    }

    // Local 3xxxxxx inputs should become 03xxxxxx.
    if (digits.length === 7 && digits.startsWith("3")) {
      digits = `0${digits}`;
    }

    return digits;
  };

  const validateCartStock = async () => {
    for (const product of products) {
      const response = await apiClient.get(`/api/products/${product.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        toast.error(`Could not check stock for ${product.title}`);
        return false;
      }

      const latestProduct = await response.json();

      if (!latestProduct.isActive) {
        toast.error(`${product.title} is currently unavailable`);
        return false;
      }

      if (latestProduct.inStock < product.amount) {
        toast.error(`Only ${latestProduct.inStock} left in stock for ${product.title}`);
        return false;
      }
    }

    return true;
  };

  // Add validation functions that match server requirements
  const validateForm = () => {
    const errors: string[] = [];
    
    // Name validation
    if (!checkoutForm.name.trim() || checkoutForm.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    
    // Lastname validation
    if (!checkoutForm.lastname.trim() || checkoutForm.lastname.trim().length < 2) {
      errors.push("Lastname must be at least 2 characters");
    }
    
    // Email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!checkoutForm.email.trim() || !emailRegex.test(checkoutForm.email.trim())) {
      errors.push("Please enter a valid email address");
    }
    
    // Lebanese phone validation
    const normalizedPhone = normalizeLebanesePhone(checkoutForm.phone);
    if (!checkoutForm.phone.trim() || !isValidLebanesePhone(normalizedPhone)) {
      errors.push("Please enter a valid Lebanese phone number");
    }
    
    // Company validation (optional)
    if (checkoutForm.company.trim() && checkoutForm.company.trim().length < 2) {
      errors.push("Company must be at least 2 characters");
    }
    
    // Address validation
    if (!checkoutForm.adress.trim() || checkoutForm.adress.trim().length < 5) {
      errors.push("Address must be at least 5 characters");
    }
    
    // City validation
    if (!checkoutForm.deliveryZoneId) {
      errors.push("Please select a delivery area");
    }
    
    return errors;
  };

  const makePurchase = async () => {
    // Client-side validation first
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    // Basic client-side checks for required fields (UX only)
    const requiredFields = [
      'name', 'lastname', 'phone', 'email', 'adress', 'deliveryZoneId'
    ];
    
    const missingFields = requiredFields.filter(field => 
      !checkoutForm[field as keyof typeof checkoutForm]?.trim()
    );

    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (products.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (total <= 0) {
      toast.error("Invalid order total");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Starting order creation...");

      const hasEnoughStock = await validateCartStock();
      if (!hasEnoughStock) {
        return;
      }
      
      // Get user ID if logged in
      let userId = sessionUser?.id || null;
      if (!userId && sessionUser?.email) {
        try {
          console.log("Getting user ID for logged-in user:", sessionUser.email);
          const userResponse = await apiClient.get(`/api/users/email/${encodeURIComponent(sessionUser.email)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id;
            console.log("✅ Found user ID:", userId);
          } else {
            console.log("Could not find user with email:", sessionUser.email);
          }
        } catch (userError) {
          console.log("⚠️  Error getting user ID:", userError);
        }
      }
      
      // Prepare the order data
      const orderData = {
        name: checkoutForm.name.trim(),
        lastname: checkoutForm.lastname.trim(),
        phone: normalizeLebanesePhone(checkoutForm.phone.trim()),
        email: checkoutForm.email.trim().toLowerCase(),
        company: checkoutForm.company.trim(),
        adress: checkoutForm.adress.trim(),
        apartment: checkoutForm.apartment.trim(),
        status: "pending",
        total: total,
        city: selectedDeliveryZone?.city || checkoutForm.city.trim(),
        deliveryZoneId: checkoutForm.deliveryZoneId,
        orderNotice: checkoutForm.orderNotice.trim(),
        userId: userId // Add user ID for notifications
      };

      console.log("📋 Order data being sent:", orderData);

      // Send order data to server for validation and processing
      const response = await apiClient.post("/api/orders", orderData);

      console.log("📡 API Response received:");
      console.log("  Status:", response.status);
      console.log("  Status Text:", response.statusText);
      console.log("  Response OK:", response.ok);
      
      // Check if response is ok before parsing
      if (!response.ok) {
        console.error("❌ Response not OK:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        
        // Try to parse as JSON to get detailed error info
        try {
          const errorData = JSON.parse(errorText);
          console.error("Parsed error data:", errorData);
          
          // Handle different error types
          if (response.status === 409) {
            // Duplicate order error
            toast.error(errorData.details || errorData.error || "Duplicate order detected");
            return; // Don't throw, just return to stop execution
          } else if (errorData.details && Array.isArray(errorData.details)) {
            // Validation errors
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else if (typeof errorData.details === 'string') {
            // Single error message in details
            toast.error(errorData.details);
          } else {
            // Fallback error message
            toast.error(errorData.error || "Order creation failed");
          }
        } catch (parseError) {
          console.error("Could not parse error as JSON:", parseError);
          toast.error("Order creation failed. Please try again.");
        }
        
        return; // Stop execution instead of throwing
      }

      const data = await response.json();
      console.log("✅ Parsed response data:", data);
      
      const orderId: string = data.id;
      const orderNumber = Number.isFinite(Number(data.orderNumber)) ? Number(data.orderNumber) : null;
      console.log("🆔 Extracted order ID:", orderId);

      if (!orderId) {
        console.error("❌ Order ID is missing or falsy!");
        console.error("Full response data:", JSON.stringify(data, null, 2));
        throw new Error("Order ID not received from server");
      }

      console.log("✅ Order ID validation passed, proceeding with product addition...");

      // Add products to order
      for (let i = 0; i < products.length; i++) {
        console.log(`🛍️ Adding product ${i + 1}/${products.length}:`, {
          orderId,
          productId: products[i].id,
          quantity: products[i].amount
        });
        
        await addOrderProduct(
          orderId,
          products[i].id,
          products[i].amount,
          products[i].selectedColor,
          products[i].selectedSize
        );
        console.log(`✅ Product ${i + 1} added successfully`);
      }

      console.log(" All products added successfully!");

      const completedOrderSummary: CheckoutSuccessSummary = {
        orderId,
        orderNumber,
        customerName: `${checkoutForm.name.trim()} ${checkoutForm.lastname.trim()}`.trim(),
        items: products.map((product) => ({
          cartItemId: product.cartItemId,
          title: product.title,
          image: product.image,
          amount: product.amount,
          price: product.price,
          selectedColor: product.selectedColor,
          selectedSize: product.selectedSize,
        })),
        subtotal: total,
        deliveryFee,
        taxes: orderTaxTotal,
        total: orderGrandTotal,
      };

      trackPurchaseEvent({
        transactionId: orderId,
        value: total,
        tax: orderTaxTotal,
        shipping: deliveryFee,
        items: buildCartAnalyticsItems(products),
      });

      hasCompletedCheckout.current = true;
      setSuccessSummary(completedOrderSummary);

      // Clear form and cart
      const defaultDeliveryZone =
        deliveryZones.find((zone) => zone.code === "standard-lebanon") || deliveryZones[0];
      setCheckoutForm({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        company: "",
        adress: "",
        apartment: "",
        city: defaultDeliveryZone?.city || "",
        deliveryZoneId: defaultDeliveryZone?.id || "",
        orderNotice: "",
      });
      clearCart();
      
      // Refresh notification count if user is logged in
      try {
        // This will trigger a refresh of notifications in the background
        window.dispatchEvent(new CustomEvent('orderCompleted'));
      } catch (error) {
        console.log('Note: Could not trigger notification refresh');
      }

    } catch (error: any) {
      console.error("💥 Error in makePurchase:", error);
      
      // Handle server validation errors
      if (error.response?.status === 400) {
        console.log(" Handling 400 error...");
        try {
          const errorData = await error.response.json();
          console.log("Error data:", errorData);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Show specific validation errors
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else {
            toast.error(errorData.error || "Validation failed");
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          toast.error("Validation failed");
        }
      } else if (error.response?.status === 409) {
        toast.error("Duplicate order detected. Please wait before creating another order.");
      } else {
        console.log("🔍 Handling generic error...");
        toast.error(error?.message || "Failed to create order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOrderProduct = async (
    orderId: string,
    productId: string,
    productQuantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    try {
      console.log("️ Adding product to order:", {
        customerOrderId: orderId,
        productId,
        quantity: productQuantity
      });
      
      const response = await apiClient.post("/api/order-product", {
        customerOrderId: orderId,
        productId: productId,
        quantity: productQuantity,
        selectedColor,
        selectedSize,
      });

      console.log("📡 Product order response:", response);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Product order failed:", response.status, errorText);
        let message = `Product order failed: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          message = errorData.error || errorData.details || message;
        } catch {
          message = errorText || message;
        }
        throw new Error(message);
      }

      const data = await response.json();
      console.log("✅ Product order successful:", data);
      
    } catch (error) {
      console.error("💥 Error creating product order:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (successSummary || hasCompletedCheckout.current || isSubmitting) {
      return;
    }

    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, [isMounted, isSubmitting, products.length, router, successSummary]);

  const closeSuccessDialog = () => {
    hasCompletedCheckout.current = false;
    setSuccessSummary(null);
    router.push("/");
  };

  if (!isMounted) {
    return (
      <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
        <SectionTitle title="Checkout" path="Home | Cart | Checkout" />
        <main className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center">
            <p className="text-sm text-[var(--site-muted)]">Loading checkout...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <SectionTitle title="Checkout" path="Home | Cart | Checkout" />
      
      <div className="hidden h-full w-1/2 bg-[var(--site-bg)] lg:block" aria-hidden="true" />
      <div className="hidden h-full w-1/2 bg-[var(--site-panel)] lg:block" aria-hidden="true" />

      <main className="relative mx-auto grid max-w-screen-2xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
        <h1 className="sr-only">Order information</h1>

        {/* Order Summary */}
        <section
          aria-labelledby="summary-heading"
          className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-4 pb-10 pt-16 sm:px-6 lg:col-start-2 lg:row-start-1 lg:px-8 lg:pb-16"
        >
          <div className="mx-auto max-w-lg lg:max-w-none">
            <h2 id="summary-heading" className="text-lg font-bold text-[var(--site-text)]">
              Order summary
            </h2>

            <ul
              role="list"
              className="divide-y divide-[var(--site-border)] text-sm font-medium text-[var(--site-text)]"
            >
              {products.map((product) => (
                <li key={product?.cartItemId} className="flex items-start space-x-4 py-6">
                  <Image
                    src={product?.image ? `/${product?.image}` : "/product_placeholder.webp"}
                    alt={product?.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none rounded-md object-cover object-center"
                  />
                  <div className="flex-auto space-y-1">
                    <h3>{product?.title}</h3>
                    <p className="text-[var(--site-muted)]">x{product?.amount}</p>
                    {product.selectedColor && (
                      <p className="text-[var(--site-muted)]">Color: {product.selectedColor}</p>
                    )}
                    {product.selectedSize && (
                      <p className="text-[var(--site-muted)]">Size: {product.selectedSize}</p>
                    )}
                  </div>
                  <p className="flex-none text-base font-medium">
                    ${product?.price}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="hidden space-y-6 border-t border-[var(--site-border)] pt-6 text-sm font-medium text-[var(--site-text)] lg:block">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--site-muted)]">Subtotal</dt>
                <dd>${total}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--site-muted)]">Shipping</dt>
                <dd>${deliveryFee.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--site-muted)]">Taxes</dt>
                <dd>${orderTaxTotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-6">
                <dt className="text-base">Total</dt>
                <dd className="text-base">
                  ${orderGrandTotal}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <form className="px-4 pt-16 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0">
          <div className="mx-auto max-w-lg lg:max-w-none">
            {/* Contact Information */}
            <section aria-labelledby="contact-info-heading">
              <h2
                id="contact-info-heading"
                className="text-lg font-bold text-[var(--site-text)]"
              >
                Contact information
              </h2>

              <div className="mt-6">
                <label
                  htmlFor="name-input"
                  className="block text-sm font-medium text-[var(--site-muted)]"
                >
                  Name * (min 2 characters)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.name}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        name: e.target.value,
                      })
                    }
                    type="text"
                    id="name-input"
                    name="name-input"
                    autoComplete="given-name"
                    required
                    disabled={isSubmitting}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="lastname-input"
                  className="block text-sm font-medium text-[var(--site-muted)]"
                >
                  Lastname * (min 2 characters)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.lastname}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        lastname: e.target.value,
                      })
                    }
                    type="text"
                    id="lastname-input"
                    name="lastname-input"
                    autoComplete="family-name"
                    required
                    disabled={isSubmitting}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="phone-input"
                  className="block text-sm font-medium text-[var(--site-muted)]"
                >
                  Phone number * (Lebanon)
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.phone}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        phone: e.target.value,
                      })
                    }
                    type="tel"
                    id="phone-input"
                    name="phone-input"
                    autoComplete="tel"
                    placeholder="03 123 456 or +961 3 123 456"
                    required
                    disabled={isSubmitting}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-[var(--site-muted)]"
                >
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.email}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    id="email-address"
                    name="email-address"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className={inputClassName}
                  />
                </div>
              </div>
            </section>

            {/* Payment Notice */}
            <section className="mt-10">
              <div className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--site-text)]">
                      Payment method
                    </h3>
                    <p className="mt-1 text-sm text-[var(--site-muted)]">
                      Choose how you want to pay for this order.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <svg
                      className="mr-1.5 h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.415 0l-3.2-3.2a1 1 0 111.414-1.42l2.493 2.494 6.493-6.494a1 1 0 011.415 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Available
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--site-accent)] bg-[var(--site-accent-soft)] px-4 py-3">
                    <input
                      type="radio"
                      name="payment-method"
                      value="cash-on-delivery"
                      defaultChecked
                      readOnly
                      className="mt-1 h-4 w-4 border-[var(--site-accent)] text-[var(--site-accent)] focus:ring-[var(--site-accent)]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--site-text)]">
                          Cash on delivery
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                          <svg
                            className="mr-1 h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.415 0l-3.2-3.2a1 1 0 111.414-1.42l2.493 2.494 6.493-6.494a1 1 0 011.415 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Active
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--site-muted)]">
                        Pay in cash when your order arrives.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 opacity-70">
                    <input
                      type="radio"
                      name="payment-method"
                      value="wish"
                      disabled
                      className="mt-1 h-4 w-4 cursor-not-allowed border-[var(--site-border)] text-[var(--site-muted)]"
                    />
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#f31d4f] text-lg font-black italic text-white">
                          w
                        </span>
                        <span className="text-base font-black text-[#f31d4f]">
                          Whish
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[var(--site-panel)] px-2 py-0.5 text-xs font-semibold text-[var(--site-muted)]">
                          Coming soon
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--site-muted)]">
                        Whish payments are not available yet.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section aria-labelledby="shipping-heading" className="mt-10">
              <h2
                id="shipping-heading"
                className="text-lg font-bold text-[var(--site-text)]"
              >
                Shipping address
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-[var(--site-muted)]"
                  >
                    Company
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="company"
                      name="company"
                      disabled={isSubmitting}
                      className={inputClassName}
                      value={checkoutForm.company}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          company: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-[var(--site-muted)]"
                  >
                    Address *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      required
                      disabled={isSubmitting}
                      className={inputClassName}
                      value={checkoutForm.adress}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          adress: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="apartment"
                    className="block text-sm font-medium text-[var(--site-muted)]"
                  >
                    Apartment, suite, etc. (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      disabled={isSubmitting}
                      className={inputClassName}
                      value={checkoutForm.apartment}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          apartment: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="delivery-zone"
                    className="block text-sm font-medium text-[var(--site-muted)]"
                  >
                    Delivery area *
                  </label>
                  <div className="mt-1">
                    <select
                      id="delivery-zone"
                      name="delivery-zone"
                      required
                      disabled={isSubmitting}
                      className={inputClassName}
                      value={checkoutForm.deliveryZoneId}
                      onChange={(e) =>
                        setCheckoutForm((current) => {
                          const zone = deliveryZones.find((item) => item.id === e.target.value);
                          return {
                            ...current,
                            deliveryZoneId: e.target.value,
                            city: zone?.city || "",
                          };
                        })
                      }
                    >
                      <option value="">Select delivery area</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label} - ${Number(zone.fee || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedDeliveryZone ? (
                    <p className="mt-2 text-sm font-semibold text-[var(--site-muted)]">
                      Delivery fee: ${deliveryFee.toFixed(2)}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="order-notice"
                    className="block text-sm font-medium text-[var(--site-muted)]"
                  >
                    Order notice
                  </label>
                  <div className="mt-1">
                    <textarea
                      className={`${inputClassName} min-h-32`}
                      id="order-notice"
                      name="order-notice"
                      autoComplete="order-notice"
                      disabled={isSubmitting}
                      value={checkoutForm.orderNotice}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          orderNotice: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>
            </section>

            <div className="ml-0 mt-10 border-t border-[var(--site-border)] pt-6">
              <button
                type="button"
                onClick={makePurchase}
                disabled={isSubmitting}
                className="theme-button w-full rounded-md border border-transparent px-20 py-2 text-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)] sm:order-last disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Processing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {successSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-success-title"
            className="relative w-full max-w-2xl rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={closeSuccessDialog}
              className="absolute right-5 top-5 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            >
              Close
            </button>

            <div className="pr-20 text-center sm:pr-0">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5 animate-[checkoutSuccessPop_560ms_cubic-bezier(0.22,1,0.36,1)_both]">
                <svg className="h-12 w-12" viewBox="0 0 52 52" fill="none" aria-hidden="true">
                  <circle
                    className="animate-[checkoutSuccessCircle_720ms_ease-out_120ms_both]"
                    cx="26"
                    cy="26"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    className="animate-[checkoutSuccessCheck_520ms_ease-out_520ms_both]"
                    d="M16 27.5l6.4 6.4L37 19.3"
                    stroke="currentColor"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 id="checkout-success-title" className="text-2xl font-black text-[var(--site-text)]">
                Order confirmed
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--site-muted)]">
                Thanks{successSummary.customerName ? `, ${successSummary.customerName}` : ""}. Your order has been placed successfully.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--site-text)]">
                  Order reference
                </p>
                <p className="text-sm font-bold text-[var(--site-accent)]">
                  {successSummary.orderNumber
                    ? `#${successSummary.orderNumber}`
                    : successSummary.orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--site-muted)]">Delivery fee</p>
                <p className="text-sm font-semibold text-[var(--site-text)]">${successSummary.deliveryFee.toFixed(2)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--site-muted)]">Estimated delivery</p>
                <p className="text-sm font-semibold text-[var(--site-text)]">3-5 business days</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--site-muted)]">Payment</p>
                <p className="text-sm font-semibold text-[var(--site-text)]">Cash on delivery</p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                Order summary
              </h3>
              <div className="mt-3 space-y-3">
                {successSummary.items.map((item) => (
                  <div
                    key={item.cartItemId || `${item.title}-${item.amount}`}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--site-border)] bg-white">
                        <Image
                          src={item.image ? `/${item.image.replace(/^\/+/, "")}` : "/product_placeholder.webp"}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--site-text)]">{item.title}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--site-muted)]">
                          <span>Qty: {item.amount}</span>
                          {item.selectedColor ? <span>Color: {item.selectedColor}</span> : null}
                          {item.selectedSize ? <span>Size: {item.selectedSize}</span> : null}
                        </div>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[var(--site-text)]">
                      ${(item.price * item.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--site-border)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--site-muted)]">Subtotal</span>
                <span className="font-semibold text-[var(--site-text)]">${successSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[var(--site-muted)]">Delivery fee</span>
                <span className="font-semibold text-[var(--site-text)]">${successSummary.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[var(--site-muted)]">Taxes</span>
                <span className="font-semibold text-[var(--site-text)]">${successSummary.taxes.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--site-border)] pt-4">
                <span className="text-base font-bold text-[var(--site-text)]">Total</span>
                <span className="text-lg font-black text-[var(--site-accent)]">${successSummary.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--site-text)]">Need any more help?</p>
                <p className="mt-1 text-sm text-[var(--site-muted)]">
                  Contact us on WhatsApp: +961 71 089 840
                </p>
              </div>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15"
              >
                Open WhatsApp
              </a>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:border-emerald-500/30 hover:text-emerald-700"
              >
                Ask on WhatsApp
              </a>
              <button
                type="button"
                onClick={closeSuccessDialog}
                className="theme-button inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

