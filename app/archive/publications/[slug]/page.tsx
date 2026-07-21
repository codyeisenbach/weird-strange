import { GridTileImage } from "components/grid/tile";
import {
  WikiArticle,
  WikiInfobox,
  WikiLink,
  WikiSection,
} from "components/archive/wiki-article";
import Footer from "components/layout/footer";
import { getPublication } from "lib/archive";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const publication = await getPublication(params.slug);

  if (!publication) return notFound();

  return {
    title: publication.title,
    description: publication.description || `${publication.title} in the archive.`,
  };
}

export default async function PublicationPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const publication = await getPublication(params.slug);

  if (!publication) return notFound();

  return (
    <>
      <WikiArticle
        title={publication.title}
        subtitle="From the Weird Strange Archive"
        body={publication.description}
        infobox={
          <WikiInfobox
            title={publication.title}
            src={publication.imagePath}
            alt={publication.imageAlt || publication.title}
            facts={[
              {
                label: "Artists",
                value:
                  publication.artists.length > 0 ? (
                    <ul>
                      {publication.artists.map((artist) => (
                        <li key={artist.id}>
                          <WikiLink href={`/archive/artists/${artist.slug}`}>
                            {artist.name}
                          </WikiLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        }
      >
        {publication.products.length > 0 ? (
          <WikiSection title="Related products">
            <ul className="flex w-full gap-4 overflow-x-auto pt-1">
              {publication.products.map((product) => (
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
          </WikiSection>
        ) : null}
      </WikiArticle>
      <Footer />
    </>
  );
}
