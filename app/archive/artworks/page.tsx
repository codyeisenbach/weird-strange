import { createArtworkEntry } from "app/archive/actions";
import { ArchiveTile } from "components/archive/tile";
import { NewArtworkForm } from "components/archive/new-artwork-form";
import { getAdminUser } from "lib/admin/auth";
import { getArtists, getArtworks, getPublications } from "lib/archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artworks",
  description: "Browse every artwork in the archive.",
};

export default async function ArtworksPage() {
  const [artworks, admin] = await Promise.all([getArtworks(), getAdminUser()]);

  // Only fetched for admins, since they're just the <select> options for
  // the create form — no reason to pay for these queries on every public
  // page load.
  const [artists, publications] = admin
    ? await Promise.all([getArtists(), getPublications()])
    : [[], []];

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-1 py-12 md:px-4">
      <h1 className="text-3xl font-bold text-ws-charcoal">Artworks</h1>

      {admin ? (
        <div className="mt-6">
          <NewArtworkForm
            artists={artists}
            publications={publications}
            action={createArtworkEntry}
          />
        </div>
      ) : null}

      {artworks.length === 0 ? (
        <p className="mt-6 text-lg text-ws-text-muted">
          No artworks found in the archive.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artworks.map((artwork) => (
            <li key={artwork.id}>
              <ArchiveTile
                href={`/archive/artworks/${artwork.slug}`}
                src={artwork.imagePath}
                alt={artwork.imageAlt || artwork.title}
                title={artwork.title}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
