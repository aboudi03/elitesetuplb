"use client";
import { FaXmark } from "react-icons/fa6";
import { Toaster, ToastBar, toast } from "react-hot-toast";

import React from "react";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "",
          style: {
            fontSize: "17px",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid var(--site-border)",
            background: "var(--site-panel)",
            color: "var(--site-text)",
            boxShadow: "0 18px 45px rgba(0, 0, 0, 0.14)",
          },
          success: {
            iconTheme: {
              primary: "var(--site-accent)",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      >
        {(toastItem) => (
          <ToastBar toast={toastItem}>
            {({ icon, message }) => (
              <div className="flex w-full items-start gap-3">
                <div className="pt-0.5">{icon}</div>
                <div className="flex-1 pr-1 text-[15px] leading-6">{message}</div>
                <button
                  type="button"
                  onClick={() => toast.dismiss(toastItem.id)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-muted)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                  aria-label="Close notification"
                >
                  <FaXmark className="text-sm" />
                </button>
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      {children}
    </>
  );
};

export default Providers;
