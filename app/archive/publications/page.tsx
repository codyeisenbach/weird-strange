import { ArchiveTile } from "components/archive/tile";
import Footer from "components/layout/footer";
import { getPublications } from "lib/archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description: "Browse every publication in the archive.",
};

export default async function PublicationsPage() {
  const publications = await getPublications();

  return (
    <>
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12">
        <h1 className="text-3xl font-bold text-ws-charcoal">Publications</h1>

        {publications.length === 0 ? (
          <p className="mt-6 text-lg text-neutral-500">
            No publications found in the archive.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {publications.map((publication) => (
              <li key={publication.id}>
                <ArchiveTile
                  href={`/archive/publications/${publication.slug}`}
                  src={publication.imagePath}
                  alt={publication.imageAlt || publication.title}
                  title={publication.title}
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
