import {
  createPublicationEntry,
  deletePublicationAction,
} from "app/archive/actions";
import { PublicationList } from "components/archive/publication-list";
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

      <PublicationList
        publications={publications}
        admin={Boolean(admin)}
        deleteAction={deletePublicationAction}
      />
    </section>
  );
}
