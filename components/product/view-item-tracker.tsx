"use client";

import { trackViewItem } from "lib/analytics/ecommerce";
import type { Product, ProductVariant } from "lib/shopify/types";
import { useEffect } from "react";

export function ViewItemTracker({
  product,
  variant,
}: {
  product: Product;
  variant?: ProductVariant;
}) {
  useEffect(() => {
    trackViewItem(product, variant);
  }, [product.id, variant?.id]);

  return null;
}
