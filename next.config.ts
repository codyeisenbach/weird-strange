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
    // Vestigial: image uploads now go browser -> R2 directly via a
    // presigned URL (see getArtworkImageUploadUrl/uploadArtworkImage in
    // lib/archive/index.ts), so no file bytes actually route through a
    // Server Action anymore, and this setting doesn't constrain that path.
    // Kept as a defensive ceiling, raised to stay comfortably above
    // MAX_IMAGE_SIZE_BYTES (15MB) in lib/archive/index.ts. Keep this in
    // sync with MAX_IMAGE_SIZE_BYTES if that ever changes.
    serverActions: {
      bodySizeLimit: "16mb",
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
      // TEMPORARY: picsum.photos is only here to supply a real portrait
      // placeholder for the banner carousel's mobile-image demo (see
      // PLACEHOLDER_BANNER_IMAGES in app/page.tsx). Remove this entry once
      // real mobile banner crops replace the picsum URLs there.
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};
