import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/utils/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

async function syncProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
  });

  const averageRating = aggregate._avg.rating ?? 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(averageRating),
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { productId } = await context.params;

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({
    averageRating,
    count: reviews.length,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      authorName: review.user.email?.split("@")[0] || "Customer",
      isEdited:
        review.updatedAt instanceof Date &&
        review.createdAt instanceof Date &&
        review.updatedAt.getTime() !== review.createdAt.getTime(),
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Please log in to leave a review." },
      { status: 401 }
    );
  }

  const { productId } = await context.params;
  const body = await request.json();

  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  if (comment.length < 8) {
    return NextResponse.json(
      { error: "Comment must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return NextResponse.json(
      { error: "Product not found." },
      { status: 404 }
    );
  }

  await prisma.review.upsert({
    where: {
      productId_userId: {
        productId,
        userId,
      },
    },
    create: {
      productId,
      userId,
      rating,
      comment,
    },
    update: {
      rating,
      comment,
    },
  });

  await syncProductRating(productId);

  return NextResponse.json({ success: true });
}
