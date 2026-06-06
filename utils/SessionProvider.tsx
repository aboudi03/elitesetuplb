"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";

const AuthProvider = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: React.ComponentProps<typeof SessionProvider>["session"];
}) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProvider;
