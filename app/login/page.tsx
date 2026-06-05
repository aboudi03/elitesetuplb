"use client";

import { CustomButton, SectionTitle } from "@/components";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const { data: session, status: sessionStatus } = useSession();
  const sessionRole = (session as any)?.user?.role;

  useEffect(() => {
    const expired = searchParams.get("expired");
    if (expired === "true") {
      setError("Your session has expired. Please log in again.");
      toast.error("Your session has expired. Please log in again.");
    }

    if (sessionStatus === "authenticated") {
      router.replace(sessionRole === "admin" ? "/admin" : "/");
    }
  }, [sessionStatus, sessionRole, router, searchParams]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    if (!isValidEmailAddressFormat(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password is invalid");
      toast.error("Password is invalid");
      return;
    }

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      toast.error("Invalid email or password");
      if (res?.url) router.replace("/");
    } else {
      setError("");
      toast.success("Successful login");
    }
  };

  if (sessionStatus === "loading") {
    return <h1 className="bg-[var(--site-bg)] p-10 text-[var(--site-text)]">Loading...</h1>;
  }

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <SectionTitle title="Login" path="Home | Login" />
      <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-black uppercase leading-9 tracking-tight">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-12 shadow sm:px-12">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-bold leading-6">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-[var(--site-text)] shadow-sm outline-none placeholder:text-[var(--site-muted)] focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent)] sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold leading-6">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-[var(--site-text)] shadow-sm outline-none placeholder:text-[var(--site-muted)] focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent)] sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--site-border)] text-[var(--site-accent)] focus:ring-[var(--site-accent)]"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-[var(--site-muted)]">
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <a href="#" className="font-semibold text-[var(--site-accent)] hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>

              <CustomButton buttonType="submit" text="Sign in" paddingX={3} paddingY={1.5} customWidth="full" textSize="sm" />
            </form>

            <div>
              <div className="relative mt-10">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[var(--site-border)]" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-[var(--site-panel)] px-6 text-[var(--site-muted)]">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 opacity-50">
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-dashed border-[var(--site-border)] bg-transparent px-3 py-2 text-[var(--site-muted)]"
                  aria-disabled="true"
                >
                  <span className="text-sm font-bold leading-6">G</span>
                  <span className="text-sm font-semibold leading-6">Google</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-dashed border-[var(--site-border)] bg-transparent px-3 py-2 text-[var(--site-muted)]"
                  aria-disabled="true"
                >
                  <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">GitHub</span>
                </button>
              </div>
              <p className="my-4 text-center text-[16px] text-[var(--site-accent)]">
                {error && error}
              </p>

              <div className="mt-6 border-t border-[var(--site-border)] pt-6 text-center">
                <p className="text-sm text-[var(--site-muted)]">New to Elite Setup?</p>
                <Link
                  href="/register"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--site-accent)] bg-[var(--site-accent-soft)] px-4 py-2 text-sm font-bold text-[var(--site-accent)] transition hover:bg-[var(--site-accent)] hover:text-white"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
