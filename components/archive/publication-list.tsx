"use client";

import { useState } from "react";
import { ArchiveTile } from "components/archive/tile";
import { DeleteTileButton } from "components/archive/delete-tile-button";
import type { Publication } from "lib/archive/types";

export function PublicationList({
  publications: initialPublications,
  admin,
  deleteAction,
}: {
  publications: Publication[];
  admin: boolean;
  deleteAction: (id: string) => Promise<{ error?: string }>;
}) {
  const [publications, setPublications] = useState(initialPublications);

  if (publications.length === 0) {
    return (
      <p className="mt-6 text-lg text-ws-text-muted">
        No publications found in the archive.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {publications.map((publication) => (
        <li key={publication.id} className="relative">
          <ArchiveTile
            href={`/archive/publications/${publication.slug}`}
            src={publication.imagePath}
            alt={publication.imageAlt || publication.title}
            title={publication.title}
          />
          {admin ? (
            <DeleteTileButton
              id={publication.id}
              confirmMessage={`Delete "${publication.title}"? Any artworks linked to it will be unlinked, not deleted. This can't be undone.`}
              deleteAction={deleteAction}
              onDeleted={(id) =>
                setPublications((current) => current.filter((p) => p.id !== id))
              }
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
