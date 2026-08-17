"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ProductPicker } from "./product-picker";
import type { Product } from "lib/shopify/types";

// Admin-only editor for an artwork's linked Shopify products: a removable
// list of what's currently linked, plus a ProductPicker to add more.
// Talks directly to the passed Server Action wrappers rather than going
// through useActionState + <form>, since picking from a list and clicking
// "Unlink" are immediate actions, not a text-form submit with a pending
// draft to hold onto.
export function LinkedProductsEditor({
  artworkId,
  allProducts,
  initialLinkedProducts,
  linkAction,
  unlinkAction,
}: {
  artworkId: string;
  allProducts: Product[];
  initialLinkedProducts: Product[];
  linkAction: (
    artworkId: string,
    handle: string,
  ) => Promise<{ error?: string }>;
  unlinkAction: (
    artworkId: string,
    handle: string,
  ) => Promise<{ error?: string }>;
}) {
  const [linked, setLinked] = useState(initialLinkedProducts);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSelect = (handle: string) => {
    const product = allProducts.find((p) => p.handle === handle);
    if (!product) return;

    setError(null);
    startTransition(async () => {
      const result = await linkAction(artworkId, handle);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLinked((current) => [...current, product]);
    });
  };

  const handleUnlink = (handle: string) => {
    setError(null);
    startTransition(async () => {
      const result = await unlinkAction(artworkId, handle);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLinked((current) => current.filter((p) => p.handle !== handle));
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {linked.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {linked.map((product) => (
            <li
              key={product.handle}
              className="flex items-center gap-3 border border-ws-border px-3 py-2 text-sm"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden border border-ws-border bg-neutral-50 dark:bg-neutral-900">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-ws-charcoal">{product.title}</div>
                <div className="truncate font-mono text-xs text-ws-text-muted">
                  {product.id}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleUnlink(product.handle)}
                className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                Unlink
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ws-text-muted">No products linked yet.</p>
      )}

      <ProductPicker
        products={allProducts}
        disabledHandles={linked.map((p) => p.handle)}
        onSelect={handleSelect}
      />

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
