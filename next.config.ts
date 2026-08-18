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
    // Next's default Server Action body limit is 1MB — well under
    // MAX_IMAGE_SIZE_BYTES (8MB) in lib/archive/index.ts's
    // uploadArtworkImage, and images are resized/downscaled server-side
    // (there's no client-side resize before upload), so the raw source
    // file's full size hits the wire as-is. Without raising this, a
    // same-or-under-8MB image still gets rejected with a 413 by the
    // platform before the request ever reaches the app's own size check or
    // the sharp resize step. Keep this in sync with MAX_IMAGE_SIZE_BYTES if
    // that ever changes.
    serverActions: {
      bodySizeLimit: "9mb",
    },
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
