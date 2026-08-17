import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

// Server-only R2 client for archive image uploads. R2 is accessed through
// its S3-compatible API (`region: "auto"` — R2 buckets aren't
// region-scoped) rather than a Cloudflare-specific SDK, since
// @aws-sdk/client-s3 is the standard way to talk to R2 from a Node.js
// server context. Must never be imported from a Client Component.
//
// CLOUDFLARE_S3_API_DOMAIN bundles both the account's R2 gateway host and
// the bucket name into one URL, e.g.
// "https://<account-id>.r2.cloudflarestorage.com/weird-strange-media" — the
// path segment after the host is the bucket, so both are parsed out of
// this single env var rather than keeping them as separate vars.
function parseApiDomain(): { endpoint: string; bucketName: string } {
  const apiDomain = process.env.CLOUDFLARE_S3_API_DOMAIN;
  if (!apiDomain) {
    throw new Error(
      "CLOUDFLARE_S3_API_DOMAIN must be set to use the R2 client.",
    );
  }

  const url = new URL(apiDomain);
  const bucketName = url.pathname.replace(/^\//, "");
  if (!bucketName) {
    throw new Error(
      `CLOUDFLARE_S3_API_DOMAIN must include the bucket name as a path segment (got "${apiDomain}").`,
    );
  }

  return { endpoint: url.origin, bucketName };
}

let client: S3Client | undefined;

export function getR2Client(): S3Client {
  if (client) return client;

  const { endpoint } = parseApiDomain();
  const accessKeyId = process.env.CLOUDFLARE_S3_ACCESS_KEY;
  const secretAccessKey = process.env.CLOUDFLARE_S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "CLOUDFLARE_S3_ACCESS_KEY and CLOUDFLARE_S3_SECRET_ACCESS_KEY must be set to use the R2 client.",
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

export function getR2BucketName(): string {
  return parseApiDomain().bucketName;
}
