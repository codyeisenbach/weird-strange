"use client";

import { trackSearch } from "lib/analytics/ecommerce";
import { useEffect } from "react";

export function SearchTracker({ searchTerm }: { searchTerm: string }) {
  useEffect(() => {
    trackSearch(searchTerm);
  }, [searchTerm]);

  return null;
}
