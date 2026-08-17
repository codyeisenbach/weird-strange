import { createPublicationEntry } from "app/archive/actions";
import { ArchiveTile } from "components/archive/tile";
import { NewEntryForm } from "components/archive/new-entry-form";
import { getAdminUser } from "lib/admin/auth";
import { getPublications } from "lib/archive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description: "Browse every publication in the archive.",
};

export default async function PublicationsPage() {
  const [publications, admin] = await Promise.all([
    getPublications(),
    getAdminUser(),
  ]);

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-1 py-12 md:px-4">
      <h1 className="text-3xl font-bold text-ws-charcoal">Publications</h1>

      {admin ? (
        <div className="mt-6">
          <NewEntryForm
            label="New publication"
            titleFieldName="title"
            titleLabel="Title"
            bodyFieldName="description"
            bodyLabel="Description"
            action={createPublicationEntry}
          />
        </div>
      ) : null}

      {publications.length === 0 ? (
        <p className="mt-6 text-lg text-ws-text-muted">
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
  );
}
