export default {
  // Allow local dev through a Cloudflare quick tunnel (HTTPS for Shopify
  // customer-account OAuth callbacks).
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "images.weirdstrange.com",
      },
    ],
  },
};
