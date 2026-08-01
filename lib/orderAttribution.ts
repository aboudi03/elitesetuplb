export type OrderAttribution = {
  source: string;
  medium: string;
  campaign?: string;
  campaignId?: string;
  adset?: string;
  adsetId?: string;
  ad?: string;
  adId?: string;
  fbclid?: string;
  landingPage: string;
  referrer?: string;
  capturedAt: string;
};

const STORAGE_KEY = "elite-setup-order-attribution";
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const clean = (value: string | null) => value?.trim() || undefined;

const getExternalReferrer = () => {
  const referrer = clean(document.referrer);
  if (!referrer) return undefined;

  try {
    return new URL(referrer).origin === window.location.origin
      ? undefined
      : referrer;
  } catch {
    return undefined;
  }
};

const inferReferrerSource = (referrer?: string) => {
  if (!referrer) return "direct";

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
};

const readStoredAttribution = (): OrderAttribution | null => {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;

    const attribution = JSON.parse(rawValue) as OrderAttribution;
    const capturedAt = Date.parse(attribution.capturedAt);

    if (
      !attribution.source ||
      !attribution.medium ||
      !attribution.landingPage ||
      !Number.isFinite(capturedAt) ||
      Date.now() - capturedAt > ATTRIBUTION_TTL_MS
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return attribution;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const captureOrderAttribution = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const fbclid = clean(params.get("fbclid"));
  const utmSource = clean(params.get("utm_source"));
  const utmMedium = clean(params.get("utm_medium"));
  const campaign = clean(params.get("utm_campaign"));
  const campaignId =
    clean(params.get("utm_id")) || clean(params.get("campaign_id"));
  const adset = clean(params.get("utm_term")) || clean(params.get("adset_name"));
  const adsetId = clean(params.get("adset_id"));
  const ad = clean(params.get("utm_content")) || clean(params.get("ad_name"));
  const adId = clean(params.get("ad_id"));
  const hasCampaignParameters = Boolean(
    fbclid ||
      utmSource ||
      utmMedium ||
      campaign ||
      campaignId ||
      adsetId ||
      adId
  );

  if (!hasCampaignParameters && readStoredAttribution()) {
    return;
  }

  const referrer = getExternalReferrer();
  const attribution: OrderAttribution = {
    source: utmSource || (fbclid ? "meta" : inferReferrerSource(referrer)),
    medium: utmMedium || (fbclid ? "paid_social" : referrer ? "referral" : "none"),
    campaign,
    campaignId,
    adset,
    adsetId,
    ad,
    adId,
    fbclid,
    landingPage: `${url.pathname}${url.search}`,
    referrer,
    capturedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
};

export const getOrderAttribution = () => {
  if (typeof window === "undefined") return null;
  return readStoredAttribution();
};
