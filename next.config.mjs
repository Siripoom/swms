/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ["antd", "lucide-react"],
  },

  // Compress images and static assets
  compress: true,

  // Optimize external images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Bundle analyzer for production debugging
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      return config;
    },
  }),

  // Performance optimization
  poweredByHeader: false,
  reactStrictMode: true,

  // Preload critical resources
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
