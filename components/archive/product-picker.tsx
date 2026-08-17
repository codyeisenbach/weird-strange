"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "lib/shopify/types";

// Admin-only "link a product" picker for an artwork. Native <select> can't
// render a thumbnail per option, so this is a Headless UI Combobox instead
// of the plain <select>s used for the artist/publication fields elsewhere
// in the archive admin forms. Search-as-you-type over the full product
// catalog (passed down already-fetched from the server, no client fetch
// here), each row showing a thumbnail, title, and the Storefront API's
// product GID (Shopify's Storefront API doesn't expose a separate numeric
// id — this GID is what's actually available, and is display-only, never
// written anywhere).
export function ProductPicker({
  products,
  disabledHandles = [],
  onSelect,
}: {
  products: Product[];
  disabledHandles?: string[];
  onSelect: (handle: string) => void;
}) {
  const [query, setQuery] = useState("");

  const disabled = new Set(disabledHandles);
  const available = products.filter((product) => !disabled.has(product.handle));
  const filtered =
    query === ""
      ? available
      : available.filter((product) =>
          product.title.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <Combobox
      value={null}
      onChange={(handle: string | null) => {
        if (handle) onSelect(handle);
        setQuery("");
      }}
    >
      <div className="relative max-w-md">
        <ComboboxInput
          className="w-full border border-ws-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ws-charcoal"
          placeholder="Search products to link…"
          displayValue={() => query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxOptions
          anchor="bottom start"
          className="z-10 max-h-72 w-(--input-width) overflow-y-auto border border-ws-border bg-white empty:hidden dark:bg-black"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ws-text-muted">
              No products found.
            </div>
          ) : (
            filtered.map((product) => (
              <ComboboxOption
                key={product.handle}
                value={product.handle}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm data-focus:bg-neutral-100 dark:data-focus:bg-neutral-900"
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
                  <div className="truncate text-ws-charcoal">
                    {product.title}
                  </div>
                  <div className="truncate font-mono text-xs text-ws-text-muted">
                    {product.id}
                  </div>
                </div>
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
