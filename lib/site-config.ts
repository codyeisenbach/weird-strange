import { baseUrl } from "lib/utils";

export const siteName = process.env.SITE_NAME!;
export const siteUrl = baseUrl;

export const gtmServerUrl = "https://data.weirdstrange.com";

// TODO: set to the store's actual logo URL once available.
export const siteLogoUrl = `${baseUrl}/favicon.ico`;

// TODO: populate with the store's real social profile URLs (Instagram, etc.)
// to enable Organization "sameAs" links.
export const siteSameAs: string[] = [];
