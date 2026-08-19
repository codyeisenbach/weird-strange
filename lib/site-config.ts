import { baseUrl } from "lib/utils";

export const siteName = process.env.SITE_NAME!;
export const siteUrl = baseUrl;

// Production hostnames the coming-soon gate applies to — preview
// deployments and localhost are deliberately excluded so they stay fully
// browsable regardless of COMING_SOON. Shared between middleware.ts (which
// enforces the gate) and any Server Component that needs to know the gate
// is active for the current request (e.g. hiding nav links) without
// duplicating this list and risking it drifting out of sync.
export const COMING_SOON_GATED_HOSTS = [
  "weirdstrange.com",
  "www.weirdstrange.com",
  "weird-strange.vercel.app",
];

export function isComingSoonGated(host: string | null | undefined): boolean {
  return (
    process.env.COMING_SOON === "true" &&
    COMING_SOON_GATED_HOSTS.includes((host ?? "").toLowerCase())
  );
}

export const gtmServerUrl = "https://data.weirdstrange.com";

// TODO: set to the store's actual logo URL once available.
export const siteLogoUrl = `${baseUrl}/favicon.ico`;

// TODO: populate with the store's real social profile URLs (Instagram, etc.)
// to enable Organization "sameAs" links.
export const siteSameAs: string[] = [];
