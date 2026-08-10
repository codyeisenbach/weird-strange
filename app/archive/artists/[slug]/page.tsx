import { saveArtistEdit } from "app/archive/actions";
import { GridTileImage } from "components/grid/tile";
import {
  ArticleBody,
  WikiArticle,
  WikiInfobox,
  WikiLink,
  WikiSection,
} from "components/archive/wiki-article";
import { WikiEditable } from "components/archive/wiki-editable";
import Footer from "components/layout/footer";
import { getAdminUser } from "lib/admin/auth";
import { getArtist } from "lib/archive";
import type { ArtistDetail } from "lib/archive/types";
import type { Metadata } from "next";
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
    description: artist.bio || `${artist.name} in the archive.`,
  };
}

function ArtistInfobox({ artist }: { artist: ArtistDetail }) {
  return (
    <WikiInfobox
      title={artist.name}
      src={artist.imagePath}
      alt={artist.imageAlt || artist.name}
      facts={[
        {
          label: "Publications",
          value:
            artist.publications.length > 0 ? (
              <ul>
                {artist.publications.map((publication) => (
                  <li key={publication.id}>
                    <WikiLink
                      href={`/archive/publications/${publication.slug}`}
                    >
                      {publication.title}
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
  );
}

function ArtistProducts({ artist }: { artist: ArtistDetail }) {
  if (artist.products.length === 0) return null;

  return (
    <WikiSection title="Related products">
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
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
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
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
  );
}

export default async function ArtistPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const [artist, admin] = await Promise.all([
    getArtist(params.slug),
    getAdminUser(),
  ]);

  if (!artist) return notFound();

  return (
    <>
      {admin ? (
        <WikiEditable
          subtitle="From the Weird Strange Archive"
          infobox={<ArtistInfobox artist={artist} />}
          titleFieldName="name"
          titleLabel="Name"
          bodyFieldName="bio"
          bodyLabel="Bio"
          initialTitle={artist.name}
          initialBody={artist.bio ?? ""}
          action={saveArtistEdit.bind(null, artist.id)}
        >
          <ArtistProducts artist={artist} />
        </WikiEditable>
      ) : (
        <WikiArticle
          title={artist.name}
          subtitle="From the Weird Strange Archive"
          body={<ArticleBody text={artist.bio} />}
          infobox={<ArtistInfobox artist={artist} />}
        >
          <ArtistProducts artist={artist} />
        </WikiArticle>
      )}
      <Footer />
    </>
  );
}
