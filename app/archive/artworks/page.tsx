import {
  createArtworkEntry,
  deleteArtworkAction,
  getArtworkImageUploadUrlAction,
} from "app/archive/actions";
import { ArtworkList } from "components/archive/artwork-list";
import { NewArtworkForm } from "components/archive/new-artwork-form";
import { getAdminUser } from "lib/admin/auth";
import { getArtists, getArtworks, getPublications } from "lib/archive";
import { getProducts } from "lib/shopify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artworks",
  description: "Browse every artwork in the archive.",
};

export default async function ArtworksPage() {
  const [artworks, admin] = await Promise.all([getArtworks(), getAdminUser()]);

  // Only fetched for admins, since they're just the <select>/picker options
  // for the create form — no reason to pay for these queries on every
  // public page load.
  const [artists, publications, allProducts] = admin
    ? await Promise.all([getArtists(), getPublications(), getProducts({})])
    : [[], [], []];

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-1 py-12 md:px-4">
      <h1 className="text-3xl font-bold text-ws-charcoal">Artworks</h1>

      {admin ? (
        <div className="mt-6">
          <NewArtworkForm
            artists={artists}
            publications={publications}
            allProducts={allProducts}
            getImageUploadUrlAction={getArtworkImageUploadUrlAction}
            action={createArtworkEntry}
          />
        </div>
      ) : null}

      <ArtworkList
        artworks={artworks}
        admin={Boolean(admin)}
        deleteAction={deleteArtworkAction}
      />
    </section>
  );
}
