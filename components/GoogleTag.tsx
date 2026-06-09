"use client";

import Script from "next/script";
import {
  GOOGLE_ADS_ID,
  GOOGLE_ANALYTICS_ID,
  googleTagId,
} from "@/lib/analytics";

export default function GoogleTag() {
  if (!googleTagId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${GOOGLE_ANALYTICS_ID ? `gtag('config', '${GOOGLE_ANALYTICS_ID}');` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
