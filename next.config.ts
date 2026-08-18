export default {
  // Allow local dev through a Cloudflare quick tunnel (HTTPS for Shopify
  // customer-account OAuth callbacks).
  allowedDevOrigins: ["*.trycloudflare.com"],
  // sharp ships a platform-specific native (.node) binary. Without this,
  // Next's server bundler can try to bundle/tree-shake it like ordinary JS,
  // which works in `next dev` (more permissive) but can fail to resolve the
  // binary at runtime once deployed (uploadArtworkImage's image resize
  // step) — this tells Next to require() it directly from
  // node_modules at runtime instead of bundling it.
  serverExternalPackages: ["sharp"],
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
      {
        protocol: "https",
        hostname: "media.weirdstrange.com",
      },
    ],
  },
};
