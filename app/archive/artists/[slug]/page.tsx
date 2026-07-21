import { ArchiveTile } from "components/archive/tile";
import { GridTileImage } from "components/grid/tile";
import Footer from "components/layout/footer";
import { getArtist } from "lib/archive";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const artist = await getArtist(params.slug);

  if (!artist) return notFound();

  return {
    title: artist.name,
    description: `${artist.name} in the archive.`,
  };
}

export default async function ArtistPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const artist = await getArtist(params.slug);

  if (!artist) return notFound();

  return (
    <>
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row">
          {artist.imagePath ? (
            <div className="relative aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
              <Image
                src={artist.imagePath}
                alt={artist.imageAlt || artist.name}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div>
            <h1 className="text-3xl font-bold text-ws-charcoal">
              {artist.name}
            </h1>
          </div>
        </div>

        {artist.publications.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-ws-charcoal">
              Publications
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {artist.publications.map((publication) => (
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
          </div>
        ) : null}

        {artist.products.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-ws-charcoal">
              Related products
            </h2>
            <ul className="mt-4 flex w-full gap-4 overflow-x-auto pt-1">
              {artist.products.map((product) => (
                <li
                  key={product.handle}
                  className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
                >
                  <Link
                    className="relative h-full w-full"
                    href={`/product/${product.handle}`}
                    prefetch={true}
                  >
                    <GridTileImage
                      alt={product.title}
                      label={{
                        title: product.title,
                        amount: product.priceRange.maxVariantPrice.amount,
                        currencyCode:
                          product.priceRange.maxVariantPrice.currencyCode,
                      }}
                      src={product.featuredImage?.url}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <Footer />
    </>
  );
}
