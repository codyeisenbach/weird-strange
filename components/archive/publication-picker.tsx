"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";
import type { Publication } from "lib/archive/types";

// Search-as-you-type picker for publications, mirroring ProductPicker's
// Combobox pattern (components/archive/product-picker.tsx) — same reason a
// native <select> doesn't fit (this needs live filtering over a
// potentially long publication list, same as the product catalog).
// Simpler than ProductPicker since publications have no thumbnail: just a
// title per row. Unlike ProductPicker, onSelect here only stages a
// publication for the caller (PublicationLinker) to batch-submit, it
// doesn't fire a request immediately.
export function PublicationPicker({
  publications,
  disabledIds = [],
  onSelect,
}: {
  publications: Publication[];
  disabledIds?: string[];
  onSelect: (publicationId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const disabled = new Set(disabledIds);
  const available = publications.filter((pub) => !disabled.has(pub.id));
  const filtered =
    query === ""
      ? available
      : available.filter((pub) =>
          pub.title.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <Combobox
      value={null}
      onChange={(id: string | null) => {
        if (id) onSelect(id);
        setQuery("");
      }}
    >
      <div className="relative max-w-xl">
        <ComboboxInput
          className="w-full border border-ws-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ws-charcoal"
          placeholder="Search publications to add…"
          displayValue={() => query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxOptions
          anchor="bottom start"
          className="z-10 max-h-72 w-(--input-width) overflow-y-auto border border-ws-border bg-white empty:hidden dark:bg-black"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ws-text-muted">
              No publications found.
            </div>
          ) : (
            filtered.map((pub) => (
              <ComboboxOption
                key={pub.id}
                value={pub.id}
                className="cursor-pointer px-3 py-2 text-sm text-ws-charcoal data-focus:bg-neutral-100 dark:data-focus:bg-neutral-900"
              >
                {pub.title}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
