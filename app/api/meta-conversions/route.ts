import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MetaContent = {
  id: string;
  quantity: number;
  item_price: number;
};

type MetaPurchaseRequest = {
  orderId?: string;
  eventId?: string;
  currency?: string;
  value?: number;
  contents?: MetaContent[];
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();
const hash = (value: string) =>
  createHash("sha256").update(normalize(value)).digest("hex");

const hashIfPresent = (value?: string | null) =>
  value?.trim() ? [hash(value)] : undefined;

const normalizeLebanesePhone = (value: string) => {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("961")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `961${digits.slice(1)}`;
  }
  if (digits.length === 7 && digits.startsWith("3")) {
    return `961${digits}`;
  }

  return digits;
};

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  undefined;

const isValidContent = (content: MetaContent) =>
  typeof content?.id === "string" &&
  content.id.length > 0 &&
  Number.isFinite(content.quantity) &&
  content.quantity > 0 &&
  Number.isFinite(content.item_price) &&
  content.item_price >= 0;

export async function POST(request: NextRequest) {
  const pixelId =
    process.env.META_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken =
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();

  if (!pixelId || !accessToken) {
    return new NextResponse(null, { status: 204 });
  }

  let body: MetaPurchaseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const eventId = body.eventId?.trim();
  const currency = body.currency?.trim().toUpperCase();
  const value = Number(body.value);
  const contents = Array.isArray(body.contents)
    ? body.contents.filter(isValidContent)
    : [];

  if (
    !orderId ||
    !eventId ||
    eventId !== `purchase_${orderId}` ||
    !/^[A-Z]{3}$/.test(currency || "") ||
    !Number.isFinite(value) ||
    value <= 0 ||
    contents.length === 0
  ) {
    return NextResponse.json(
      { error: "Invalid purchase event data" },
      { status: 400 }
    );
  }

  const order = await prisma.customer_order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      lastname: true,
      city: true,
      country: true,
      dateTime: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const userData = {
    em: hashIfPresent(order.email),
    ph: hashIfPresent(normalizeLebanesePhone(order.phone)),
    fn: hashIfPresent(order.name),
    ln: hashIfPresent(order.lastname),
    ct: hashIfPresent(order.city),
    country: hashIfPresent(order.country),
    client_ip_address: getClientIp(request),
    client_user_agent: request.headers.get("user-agent") || undefined,
    fbp: body.fbp?.trim() || undefined,
    fbc: body.fbc?.trim() || undefined,
  };

  const event = {
    event_name: "Purchase",
    event_time: Math.floor((order.dateTime || new Date()).getTime() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url:
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      undefined,
    user_data: userData,
    custom_data: {
      currency,
      value,
      content_ids: contents.map((content) => content.id),
      content_type: "product",
      contents,
      order_id: order.id,
    },
  };

  const graphVersion =
    process.env.META_GRAPH_API_VERSION?.trim() || "v24.0";
  const metaResponse = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [event],
        ...(process.env.META_TEST_EVENT_CODE?.trim()
          ? { test_event_code: process.env.META_TEST_EVENT_CODE.trim() }
          : {}),
      }),
      cache: "no-store",
    }
  );

  if (!metaResponse.ok) {
    const responseText = await metaResponse.text();
    console.error(
      "Meta Conversions API rejected Purchase event:",
      metaResponse.status,
      responseText
    );
    return NextResponse.json(
      { error: "Meta rejected the conversion event" },
      { status: 502 }
    );
  }

  return NextResponse.json({ accepted: true });
}
