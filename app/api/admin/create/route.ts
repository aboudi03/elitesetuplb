// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Security: Check for authorization token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token || token !== process.env.ADMIN_CREATION_TOKEN) {
      return Response.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.role === "admin") {
        return Response.json(
          { error: "User already exists and is already an admin" },
          { status: 400 }
        );
      }
      return Response.json(
        { error: "User already exists - use makeUserAdmin.js to promote" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        id: nanoid(),
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    return Response.json({
      success: true,
      message: `✅ Admin user created successfully!`,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return Response.json(
      { error: `Server error: ${String(error)}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
