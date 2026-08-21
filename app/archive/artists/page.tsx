import { createArtistEntry, deleteArtistAction } from "app/archive/actions";
import { ArtistList } from "components/archive/artist-list";
import { NewEntryForm } from "components/archive/new-entry-form";
import { getAdminUser } from "lib/admin/auth";
import { getArtists } from "lib/archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description: "Browse every artist in the archive.",
};

export default async function ArtistsPage() {
  const [artists, admin] = await Promise.all([getArtists(), getAdminUser()]);

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-1 py-12 md:px-4">
      <h1 className="text-3xl font-bold text-ws-charcoal">Artists</h1>

      {admin ? (
        <div className="mt-6">
          <NewEntryForm
            label="New artist"
            titleFieldName="name"
            titleLabel="Name"
            bodyFieldName="bio"
            bodyLabel="Bio"
            action={createArtistEntry}
          />
        </div>
      ) : null}

      <ArtistList
        artists={artists}
        admin={Boolean(admin)}
        deleteAction={deleteArtistAction}
      />
    </section>
  );
}
