/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.googletagmanager.com https://apis.google.com; script-src-elem 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.googletagmanager.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: https://pagead2.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.doubleclick.net https://*.googleadservices.com https://*.googleusercontent.com https://*.gstatic.com; connect-src 'self' https: wss: https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.adtrafficquality.google https://*.doubleclick.net https://*.googleadservices.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'self' https://*.google.com https://*.google https://pagead2.googlesyndication.com https://*.doubleclick.net https://googleads.g.doubleclick.net; object-src 'none'; base-uri 'self'; form-action 'self';",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Alt-Svc",
    value: 'h3=":443"; ma=86400, h2=":443"; ma=86400',
  },
];

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login?error=unauthorized",
        permanent: false,
      },
      {
        source: "/contacts",
        destination: "/contact",
        permanent: false,
      },
      {
        source: "/overview",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
