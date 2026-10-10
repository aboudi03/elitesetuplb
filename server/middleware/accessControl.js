const crypto = require("crypto");

// Routes the storefront needs without an admin session. Everything else
// requires the internal API key, which only the Next.js proxy attaches after
// it has verified the caller's session.
const PUBLIC_ROUTES = {
  GET: [
    /^\/api\/products(\/[^/]+)?$/,
    /^\/api\/categories(\/[^/]+)?$/,
    /^\/api\/images\/[^/]+$/,
    /^\/api\/search$/,
    /^\/api\/slugs\/[^/]+$/,
    /^\/api\/deals(\/[^/]+)?$/,
    /^\/api\/delivery-zones$/,
    /^\/api\/hero-slides$/,
    /^\/api\/featured-brands$/,
    /^\/api\/product-banners(\/[^/]+)?$/,
  ],
  POST: [/^\/api\/orders$/, /^\/api\/order-product$/, /^\/api\/cart-events$/],
};

// Internal fields that must never reach anonymous visitors.
const PRIVATE_FIELDS = new Set(["cost"]);

const getInternalApiKey = () => process.env.INTERNAL_API_KEY?.trim() || "";

const hasValidInternalKey = (req) => {
  const expected = getInternalApiKey();
  const provided = req.get("x-internal-api-key") || "";

  if (!expected || provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
};

const isPublicRoute = (method, pathname) => {
  const lookupMethod = method === "HEAD" ? "GET" : method;
  return (PUBLIC_ROUTES[lookupMethod] || []).some((pattern) =>
    pattern.test(pathname)
  );
};

const stripPrivateFields = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripPrivateFields);
  }

  const isPlainObject =
    value &&
    typeof value === "object" &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));

  if (isPlainObject) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !PRIVATE_FIELDS.has(key))
        .map(([key, nested]) => [key, stripPrivateFields(nested)])
    );
  }

  return value;
};

const accessControl = (req, res, next) => {
  if (req.method === "OPTIONS" || !req.path.startsWith("/api/")) {
    return next();
  }

  if (hasValidInternalKey(req)) {
    return next();
  }

  if (!isPublicRoute(req.method, req.path)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(stripPrivateFields(body));

  return next();
};

module.exports = { accessControl };
