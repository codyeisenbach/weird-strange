"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PublicationPicker } from "./publication-picker";
import type { Publication } from "lib/archive/types";

// Admin-only multi-select for bulk-linking an artist to publications —
// rendered next to the Publications row in ArtistInfobox. This does NOT
// write a direct artist<->publication relationship (there isn't one — see
// bulkCreateArtworksForPublications' comment in lib/archive/index.ts for
// why): it creates one placeholder artwork per selected publication, which
// is what the artist page's derived Publications list actually reads.
// Because of that, this component can't just update local state on
// success the way LinkedProductsEditor does — the infobox's
// artist.publications/artist.artworks come from the server (getArtist()),
// so a successful link calls router.refresh() to re-fetch them, same
// pattern as ArtworkImageUpload.
export function PublicationLinker({
  artistId,
  artistName,
  allPublications,
  currentPublicationIds,
  action,
}: {
  artistId: string;
  artistName: string;
  allPublications: Publication[];
  currentPublicationIds: string[];
  action: (
    artistId: string,
    artistName: string,
    publicationIds: string[],
  ) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [staged, setStaged] = useState<Publication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSelect = (publicationId: string) => {
    const publication = allPublications.find((p) => p.id === publicationId);
    if (!publication) return;
    setStaged((current) => [...current, publication]);
  };

  const handleRemoveStaged = (publicationId: string) => {
    setStaged((current) => current.filter((p) => p.id !== publicationId));
  };

  const handleAdd = () => {
    if (staged.length === 0) return;

    setError(null);
    startTransition(async () => {
      const result = await action(
        artistId,
        artistName,
        staged.map((p) => p.id),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setStaged([]);
      router.refresh();
    });
  };

  const disabledIds = [...currentPublicationIds, ...staged.map((p) => p.id)];

  return (
    <div className="mt-2 flex flex-col gap-2">
      {staged.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {staged.map((publication) => (
            <li
              key={publication.id}
              className="flex items-center gap-2 border border-ws-border px-2 py-1 text-xs"
            >
              <span>{publication.title}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRemoveStaged(publication.id)}
                className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <PublicationPicker
        publications={allPublications}
        disabledIds={disabledIds}
        onSelect={handleSelect}
      />

      {staged.length > 0 ? (
        <button
          type="button"
          disabled={pending}
          onClick={handleAdd}
          className="self-start border border-ws-border px-3 py-1 text-xs hover:opacity-70 disabled:opacity-50"
        >
          {pending
            ? "Adding…"
            : `Add ${staged.length} publication${staged.length === 1 ? "" : "s"}`}
        </button>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
