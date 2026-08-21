"use client";

import { useState } from "react";
import { ArchiveTile } from "components/archive/tile";
import { DeleteTileButton } from "components/archive/delete-tile-button";
import type { Artwork } from "lib/archive/types";

export function ArtworkList({
  artworks: initialArtworks,
  admin,
  deleteAction,
}: {
  artworks: Artwork[];
  admin: boolean;
  deleteAction: (id: string) => Promise<{ error?: string }>;
}) {
  const [artworks, setArtworks] = useState(initialArtworks);

  if (artworks.length === 0) {
    return (
      <p className="mt-6 text-lg text-ws-text-muted">
        No artworks found in the archive.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {artworks.map((artwork) => (
        <li key={artwork.id} className="relative">
          <ArchiveTile
            href={`/archive/artworks/${artwork.slug}`}
            src={artwork.imagePath}
            alt={artwork.imageAlt || artwork.title}
            title={artwork.title}
          />
          {admin ? (
            <DeleteTileButton
              id={artwork.id}
              confirmMessage={`Delete "${artwork.title}"? This can't be undone.`}
              deleteAction={deleteAction}
              onDeleted={(id) =>
                setArtworks((current) => current.filter((a) => a.id !== id))
              }
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
