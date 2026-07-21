import Footer from "components/layout/footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Archive",
  description: "A Wikipedia-style archive of artists and publications.",
};

export default function ArchivePage() {
  return (
    <>
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12">
        <h1 className="text-3xl font-bold text-ws-charcoal">Archive</h1>
        <p className="mt-2 max-w-prose text-neutral-500">
          A running record of the artists and publications behind the work.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/archive/artists"
            className="block rounded-lg border border-neutral-200 p-6 hover:border-blue-600 dark:border-neutral-800"
          >
            <h2 className="text-xl font-semibold text-ws-charcoal">Artists</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Browse every artist in the archive.
            </p>
          </Link>
          <Link
            href="/archive/publications"
            className="block rounded-lg border border-neutral-200 p-6 hover:border-blue-600 dark:border-neutral-800"
          >
            <h2 className="text-xl font-semibold text-ws-charcoal">
              Publications
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Browse every publication in the archive.
            </p>
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
