import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/utils/db";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  let role = (session as any)?.user?.role;

  if (!role && session.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true },
    });

    role = user?.role || undefined;

    if (user?.id && !(session as any).user.id) {
      (session as any).user.id = user.id;
    }
    if (role) {
      (session as any).user.role = role;
    }
  }

  if (role !== "admin") {
    redirect("/");
  }
  
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return false;
  }

  if ((session as any)?.user?.role === "admin") {
    return true;
  }

  if (!session.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  return user?.role === "admin";
}

