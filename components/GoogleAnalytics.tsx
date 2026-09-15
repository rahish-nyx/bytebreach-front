import Script from "next/script";

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const id = measurementId || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-TE3R7D5MCH";

  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
