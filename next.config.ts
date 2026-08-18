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
  // serverExternalPackages alone isn't sufficient on Vercel + pnpm: sharp
  // resolves its platform package (@img/sharp-linux-x64) and libvips
  // (@img/sharp-libvips-linux-x64) at runtime via process.platform/arch
  // rather than a static top-level require, and Next's output file tracer
  // (@vercel/nft, static analysis) doesn't reliably follow that indirection
  // through pnpm's nested/symlinked node_modules store — the .so files were
  // silently missing from the deployed function even though the lockfile
  // and local trace both looked correct. This forces them in explicitly,
  // regardless of what static tracing finds. If sharp's version changes,
  // this glob still matches (keyed on the package dir, not a version
  // string), so it shouldn't need updating on a routine sharp bump.
  outputFileTracingIncludes: {
    "/archive/**": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**",
    ],
  },
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
