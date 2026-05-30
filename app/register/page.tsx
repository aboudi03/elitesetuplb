"use client";

import { CustomButton, SectionTitle } from "@/components";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "block w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-[var(--site-text)] shadow-sm outline-none placeholder:text-[var(--site-muted)] focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent)] sm:text-sm sm:leading-6";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmpassword") || "");
    const acceptedTerms = formData.get("terms") === "on";

    if (!isValidEmail(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be 8 characters long");
      toast.error("Password must be 8 characters long");
      return;
    }

    if (confirmPassword !== password) {
      setError("Passwords are not equal");
      toast.error("Passwords are not equal");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the terms and privacy policy");
      toast.error("You must accept the terms and privacy policy");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setError("");
        toast.success("Registration successful");
        router.push("/login");
      } else if (data.details && Array.isArray(data.details)) {
        const errorMessage = data.details.map((err: any) => err.message).join(", ");
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (data.error) {
        setError(data.error);
        toast.error(data.error);
      } else {
        setError("Registration failed");
        toast.error("Registration failed");
      }
    } catch (error) {
      toast.error("Error, try again");
      setError("Error, try again");
      console.log(error);
    }
  };

  if (sessionStatus === "loading") {
    return <h1 className="bg-[var(--site-bg)] p-10 text-[var(--site-text)]">Loading...</h1>;
  }

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <SectionTitle title="Register" path="Home | Register" />
      <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <h2 className="mt-6 text-center text-2xl font-black uppercase leading-9 tracking-tight">
            Create your GearForge account
          </h2>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-12 shadow sm:px-12">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {[
                { id: "name", label: "Name", type: "text", autoComplete: undefined },
                { id: "lastname", label: "Lastname", type: "text", autoComplete: undefined },
                { id: "email", label: "Email address", type: "email", autoComplete: "email" },
                { id: "password", label: "Password", type: "password", autoComplete: "current-password" },
                { id: "confirmpassword", label: "Confirm password", type: "password", autoComplete: "current-password" },
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-bold leading-6">
                    {field.label}
                  </label>
                  <div className="mt-2">
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      required
                      className={inputClassName}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--site-border)] text-[var(--site-accent)] focus:ring-[var(--site-accent)]"
                />
                <label htmlFor="terms" className="ml-3 block text-sm leading-6 text-[var(--site-muted)]">
                  Accept our terms and privacy policy
                </label>
              </div>

              <CustomButton buttonType="submit" text="Sign up" paddingX={3} paddingY={1.5} customWidth="full" textSize="sm" />

              <p className="my-4 text-center text-[16px] text-[var(--site-accent)]">
                {error && error}
              </p>

              <div className="border-t border-[var(--site-border)] pt-6 text-center">
                <p className="text-sm text-[var(--site-muted)]">Already have an account?</p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-2 text-sm font-bold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)]"
                >
                  Sign in instead
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
