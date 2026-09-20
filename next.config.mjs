/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  agentRules: false,
  allowedDevOrigins: [
    "average-lexmark-beverages-sees.trycloudflare.com",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    return [
      {
        source: "/gov",
        destination: "/government/dashboard",
      },
      {
        source: "/gov/queue",
        destination: "/government/applications",
      },
      {
        source: "/gov/workspace/:id",
        destination: "/government/applications/:id/review",
      },
      {
        source: "/gov/workspace/:id/review",
        destination: "/government/applications/:id/review",
      },
      {
        source: "/gov/:path*",
        destination: "/government/:path*",
      },
    ];
  },
};

export default nextConfig;
