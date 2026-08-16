"use client";

import { useEffect } from "react";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function CaptureClickIds() {
  useEffect(() => {
    const rdtCid = new URLSearchParams(window.location.search).get(
      "rdt_cid",
    );
    if (!rdtCid) return;

    document.cookie = `_rdt_cid=${encodeURIComponent(rdtCid)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
  }, []);

  return null;
}
