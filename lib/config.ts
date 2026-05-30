function normalizeUrl(url: string | undefined, fallback: string) {
  const raw = (url || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

const config = {
  apiBaseUrl: normalizeUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "http://localhost:3001"
  ),
  nextAuthUrl: normalizeUrl(
    process.env.NEXTAUTH_URL,
    "http://localhost:3000"
  ),
};

export default config;

