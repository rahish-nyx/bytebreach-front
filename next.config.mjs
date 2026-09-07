/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
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

