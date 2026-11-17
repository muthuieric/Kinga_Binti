/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Optimise package imports to reduce JS bundle size
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
    // Security upgrade agent
    agentUpgrade: "security",
  },
  // Explicit cache headers for static assets — avoids localhost stale-cache issues
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // During local dev, never serve from browser cache (fixes the
          // "localhost browser cache issue" where stale JS/CSS is served)
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "production"
                ? "public, max-age=31536000, immutable"
                : "no-store",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
