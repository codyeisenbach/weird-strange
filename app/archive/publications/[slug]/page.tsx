import { savePublicationEdit } from "app/archive/actions";
import { GridTileImage } from "components/grid/tile";
import {
  ArticleBody,
  InfoboxFact,
  WikiArticle,
  WikiInfobox,
  WikiLink,
  WikiSection,
} from "components/archive/wiki-article";
import { WikiEditable } from "components/archive/wiki-editable";
import { JsonLd } from "components/seo/json-ld";
import { getAdminUser } from "lib/admin/auth";
import { getPublication } from "lib/archive";
import type { PublicationDetail } from "lib/archive/types";
import { siteUrl } from "lib/site-config";
import { buildBreadcrumbJsonLd } from "lib/shopify/structured-data";
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
    description:
      publication.description || `${publication.title} in the archive.`,
  };
}

function PublicationInfobox({
  publication,
}: {
  publication: PublicationDetail;
}) {
  const facts: InfoboxFact[] = [];

  if (publication.issueDate) {
    facts.push({ label: "Issue date", value: publication.issueDate });
  }

  facts.push(
    {
      label: "Artworks",
      value:
        publication.artworks.length > 0 ? (
          <ul>
            {publication.artworks.map((artwork) => (
              <li key={artwork.id}>
                <WikiLink href={`/archive/artworks/${artwork.slug}`}>
                  {artwork.title}
                </WikiLink>
              </li>
            ))}
          </ul>
        ) : (
          "—"
        ),
    },
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
  );

  return (
    <WikiInfobox
      title={publication.title}
      src={publication.imagePath}
      alt={publication.imageAlt || publication.title}
      facts={facts}
    />
  );
}

function PublicationProducts({
  publication,
}: {
  publication: PublicationDetail;
}) {
  if (publication.products.length === 0) return null;

  return (
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

export default async function PublicationPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const [publication, admin] = await Promise.all([
    getPublication(params.slug),
    getAdminUser(),
  ]);

  if (!publication) return notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Archive", url: `${siteUrl}/archive` },
    { name: "Publications", url: `${siteUrl}/archive/publications` },
    {
      name: publication.title,
      url: `${siteUrl}/archive/publications/${publication.slug}`,
    },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {admin ? (
        <WikiEditable
          subtitle="From the Weird Strange Archive"
          infobox={<PublicationInfobox publication={publication} />}
          titleFieldName="title"
          titleLabel="Title"
          bodyFieldName="description"
          bodyLabel="Description"
          initialTitle={publication.title}
          initialBody={publication.description ?? ""}
          extraFields={[
            {
              name: "issueDate",
              label: "Issue date",
              initialValue: publication.issueDate ?? "",
              placeholder: "e.g. Nov 1942, Fall 42",
            },
          ]}
          action={savePublicationEdit.bind(null, publication.id)}
        >
          <PublicationProducts publication={publication} />
        </WikiEditable>
      ) : (
        <WikiArticle
          title={publication.title}
          subtitle="From the Weird Strange Archive"
          body={<ArticleBody text={publication.description} />}
          infobox={<PublicationInfobox publication={publication} />}
        >
          <PublicationProducts publication={publication} />
        </WikiArticle>
      )}
    </>
  );
}
