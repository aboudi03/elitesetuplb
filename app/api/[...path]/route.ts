import config from "@/lib/config";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/utils/adminAuth";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const INTERNAL_API_KEY_HEADER = "x-internal-api-key";

// The backend rejects private routes unless this proxy vouches for the caller
// with the internal API key. Admins get full access; signed-in customers only
// reach their own account lookup and notifications.
async function canUsePrivateRoute(method: string, pathSegments: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return false;
  }

  if (await isAdmin()) {
    return true;
  }

  const sessionUser = session.user as { id?: string; email?: string | null };
  const [resource, first, second] = pathSegments;

  if (resource === "users" && first === "email" && method === "GET") {
    return Boolean(
      sessionUser.email && second?.toLowerCase() === sessionUser.email.toLowerCase()
    );
  }

  if (resource === "notifications") {
    const isUserScopedRead =
      method === "GET" && first && first !== "mark-read" && first !== "bulk";
    return isUserScopedRead ? first === sessionUser.id : true;
  }

  return false;
}

function buildProxyUrl(pathSegments: string[], search: string) {
  const proxyUrl = new URL(
    `/api/${pathSegments.map(encodeURIComponent).join("/")}${search}`,
    config.apiBaseUrl
  );

  return proxyUrl.toString();
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetUrl = buildProxyUrl(path || [], request.nextUrl.search);
  const headers = new Headers(request.headers);

  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  headers.delete(INTERNAL_API_KEY_HEADER);
  if (await canUsePrivateRoute(request.method, path || [])) {
    headers.set(INTERNAL_API_KEY_HEADER, process.env.INTERNAL_API_KEY?.trim() || "");
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : Buffer.from(await request.arrayBuffer()),
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-length");
    responseHeaders.delete("content-encoding");

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API proxy request failed:", error);
    return NextResponse.json(
      {
        error: "Backend proxy failed",
        details: "The website could not reach the backend service.",
      },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
