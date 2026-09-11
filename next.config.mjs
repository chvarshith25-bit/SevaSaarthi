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
        source: "/government",
        destination: "/gov",
      },
      {
        source: "/government/applications",
        destination: "/gov/queue",
      },
      {
        source: "/government/applications/:id",
        destination: "/gov/workspace/:id",
      },
      {
        source: "/government/:path*",
        destination: "/gov/:path*",
      },
    ];
  },
};

export default nextConfig;
