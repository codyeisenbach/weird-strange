"use client";

import { useActionState, useState } from "react";
import type { EditFormState } from "app/archive/actions";
import type { Artist, Publication } from "lib/archive/types";
import type { Product } from "lib/shopify/types";
import { ProductPicker } from "./product-picker";

// Admin-only "+ New artwork" affordance, mirroring NewEntryForm's
// toggle-button-to-form pattern, but with the extra artist/publication
// relational selects an artwork requires that the generic NewEntryForm
// (title + body only) can't express, plus a product picker so products can
// be linked at creation time instead of requiring a second trip to the
// artwork's detail page afterward. Selected handles are submitted as
// repeated hidden inputs (FormData supports multiple values per key) and
// linked server-side right after the artwork row is inserted.
export function NewArtworkForm({
  artists,
  publications,
  allProducts,
  action,
}: {
  artists: Artist[];
  publications: Publication[];
  allProducts: Product[];
  action: (state: EditFormState, formData: FormData) => Promise<EditFormState>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [state, formAction, pending] = useActionState<EditFormState, FormData>(
    action,
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-ws-border px-4 py-2 text-sm hover:opacity-70"
      >
        + New artwork
      </button>
    );
  }

  const addProduct = (handle: string) => {
    const product = allProducts.find((p) => p.handle === handle);
    if (!product) return;
    setSelectedProducts((current) => [...current, product]);
  };

  const removeProduct = (handle: string) => {
    setSelectedProducts((current) =>
      current.filter((p) => p.handle !== handle),
    );
  };

  return (
    <form
      action={formAction}
      className="flex max-w-3xl flex-col gap-4 border border-ws-border p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            type="text"
            name="title"
            required
            autoFocus
            className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Placement
          <input
            type="text"
            name="placement"
            placeholder="front_cover, back_cover, interior…"
            className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Artist
          <select
            name="artistId"
            required
            defaultValue=""
            className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
          >
            <option value="" disabled>
              Select an artist…
            </option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publication
          <select
            name="publicationId"
            defaultValue=""
            className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
          >
            <option value="">None</option>
            {publications.map((publication) => (
              <option key={publication.id} value={publication.id}>
                {publication.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          rows={6}
          className="border border-ws-border bg-transparent px-3 py-2 font-serif text-[17px] leading-7 outline-none focus:border-ws-charcoal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Image
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none file:mr-3 file:border-0 file:bg-ws-border file:px-3 file:py-1 file:text-sm focus:border-ws-charcoal"
        />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        Link products
        {selectedProducts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {selectedProducts.map((product) => (
              <li
                key={product.handle}
                className="flex items-center justify-between gap-3 border border-ws-border px-3 py-2 text-sm"
              >
                <span className="truncate">{product.title}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(product.handle)}
                  className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
                <input
                  type="hidden"
                  name="productHandles"
                  value={product.handle}
                />
              </li>
            ))}
          </ul>
        ) : null}
        <ProductPicker
          products={allProducts}
          disabledHandles={selectedProducts.map((p) => p.handle)}
          onSelect={addProduct}
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-ws-border px-4 py-2 text-sm hover:opacity-70 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="px-4 py-2 text-sm text-ws-text-muted hover:opacity-70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
