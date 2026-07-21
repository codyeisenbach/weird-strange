import { ArchiveTile } from "components/archive/tile";
import Footer from "components/layout/footer";
import { getArtists } from "lib/archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description: "Browse every artist in the archive.",
};

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <>
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12">
        <h1 className="text-3xl font-bold text-ws-charcoal">Artists</h1>

        {artists.length === 0 ? (
          <p className="mt-6 text-lg text-neutral-500">
            No artists found in the archive.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artists.map((artist) => (
              <li key={artist.id}>
                <ArchiveTile
                  href={`/archive/artists/${artist.slug}`}
                  src={artist.imagePath}
                  alt={artist.imageAlt || artist.name}
                  title={artist.name}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <Footer />
    </>
  );
}
