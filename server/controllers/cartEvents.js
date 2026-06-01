const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createCartEvent(request, response) {
  try {
    const quantity = Number(request.body?.quantity || 1);
    const productId = request.body?.productId;
    const sessionId = request.body?.sessionId;
    const eventType = request.body?.eventType || "ADD";

    if (!productId || typeof productId !== "string") {
      return response.status(400).json({
        error: "productId is required",
      });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return response.status(400).json({
        error: "sessionId is required",
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return response.status(400).json({
        error: "quantity must be a positive number",
      });
    }

    const cartEvent = await prisma.cartEvent.create({
      data: {
        productId,
        productTitle:
          typeof request.body?.productTitle === "string"
            ? request.body.productTitle.trim().slice(0, 191)
            : null,
        userId:
          typeof request.body?.userId === "string" && request.body.userId.trim()
            ? request.body.userId
            : null,
        sessionId,
        quantity,
        eventType,
      },
    });

    return response.status(201).json(cartEvent);
  } catch (error) {
    console.error("Error creating cart event:", error);
    return response.status(500).json({
      error: "Failed to record cart event",
    });
  }
}

module.exports = {
  createCartEvent,
};
