"use client";

import { useState } from "react";
import { ArchiveTile } from "components/archive/tile";
import { DeleteTileButton } from "components/archive/delete-tile-button";
import type { Artist } from "lib/archive/types";

export function ArtistList({
  artists: initialArtists,
  admin,
  deleteAction,
}: {
  artists: Artist[];
  admin: boolean;
  deleteAction: (id: string) => Promise<{ error?: string }>;
}) {
  const [artists, setArtists] = useState(initialArtists);

  if (artists.length === 0) {
    return (
      <p className="mt-6 text-lg text-ws-text-muted">
        No artists found in the archive.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {artists.map((artist) => (
        <li key={artist.id} className="relative">
          <ArchiveTile
            href={`/archive/artists/${artist.slug}`}
            src={artist.imagePath}
            alt={artist.imageAlt || artist.name}
            title={artist.name}
          />
          {admin ? (
            <DeleteTileButton
              id={artist.id}
              confirmMessage={`Delete "${artist.name}"? This will also permanently delete every artwork by this artist. This can't be undone.`}
              deleteAction={deleteAction}
              onDeleted={(id) =>
                setArtists((current) => current.filter((a) => a.id !== id))
              }
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
