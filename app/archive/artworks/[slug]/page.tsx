import {
  getArtworkImageUploadUrlAction,
  linkArtworkProductAction,
  saveArtworkEdit,
  unlinkArtworkProductAction,
  uploadArtworkImageAction,
} from "app/archive/actions";
import { GridTileImage } from "components/grid/tile";
import {
  ArticleBody,
  InfoboxFact,
  WikiArticle,
  WikiInfobox,
  WikiLink,
  WikiSection,
} from "components/archive/wiki-article";
import { WikiEditableArtwork } from "components/archive/wiki-editable-artwork";
import { LinkedProductsEditor } from "components/archive/linked-products-editor";
import { ArtworkImageUpload } from "components/archive/artwork-image-upload";
import { JsonLd } from "components/seo/json-ld";
import { getAdminUser } from "lib/admin/auth";
import { getArtists, getArtwork, getPublications } from "lib/archive";
import { getProducts } from "lib/shopify";
import type { ArtworkDetail } from "lib/archive/types";
import { siteUrl } from "lib/site-config";
import {
  buildArtworkCreativeWorkJsonLd,
  buildBreadcrumbJsonLd,
} from "lib/shopify/structured-data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const artwork = await getArtwork(params.slug);

  if (!artwork) return notFound();

  return {
    title: artwork.title,
    description: artwork.description || `${artwork.title} in the archive.`,
  };
}

function ArtworkInfobox({ artwork }: { artwork: ArtworkDetail }) {
  const facts: InfoboxFact[] = [
    {
      label: "Artist",
      value: (
        <WikiLink href={`/archive/artists/${artwork.artist.slug}`}>
          {artwork.artist.name}
        </WikiLink>
      ),
    },
  ];

  if (artwork.publication) {
    facts.push({
      label: "Publication",
      value: (
        <WikiLink href={`/archive/publications/${artwork.publication.slug}`}>
          {artwork.publication.title}
        </WikiLink>
      ),
    });

    // Issue date belongs to the publication row, not the artwork — shown
    // here for convenience (front/back cover of the same issue share one
    // date), but only editable on the publication's own page, linked to
    // below rather than duplicating an edit control for a row this page
    // doesn't own.
    if (artwork.publication.issueDate) {
      facts.push({
        label: "Issue date",
        value: (
          <WikiLink href={`/archive/publications/${artwork.publication.slug}`}>
            {artwork.publication.issueDate}
          </WikiLink>
        ),
      });
    }
  }

  if (artwork.placement) {
    facts.push({ label: "Placement", value: artwork.placement });
  }

  return (
    <WikiInfobox
      title={artwork.title}
      src={artwork.imagePath}
      alt={artwork.imageAlt || artwork.title}
      facts={facts}
    />
  );
}

function ArtworkProducts({ artwork }: { artwork: ArtworkDetail }) {
  if (artwork.products.length === 0) return null;

  return (
    <WikiSection title="Related products">
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {artwork.products.map((product) => (
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

export default async function ArtworkPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const [artwork, admin] = await Promise.all([
    getArtwork(params.slug),
    getAdminUser(),
  ]);

  if (!artwork) return notFound();

  // Only fetched for admins, since they're just the <select>/picker options
  // for the edit form and the product-linking UI.
  const [artists, publications, allProducts] = admin
    ? await Promise.all([getArtists(), getPublications(), getProducts({})])
    : [[], [], []];

  const artworkUrl = `${siteUrl}/archive/artworks/${artwork.slug}`;
  const artworkJsonLd = buildArtworkCreativeWorkJsonLd(artwork, artworkUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Archive", url: `${siteUrl}/archive` },
    { name: "Artworks", url: `${siteUrl}/archive/artworks` },
    { name: artwork.title, url: artworkUrl },
  ]);

  return (
    <>
      <JsonLd data={[artworkJsonLd, breadcrumbJsonLd]} />
      {admin ? (
        <WikiEditableArtwork
          subtitle="From the Weird Strange Archive"
          infobox={<ArtworkInfobox artwork={artwork} />}
          artists={artists}
          publications={publications}
          initial={{
            title: artwork.title,
            artistId: artwork.artist.id,
            publicationId: artwork.publication?.id ?? "",
            placement: artwork.placement ?? "",
            description: artwork.description ?? "",
          }}
          action={saveArtworkEdit.bind(null, artwork.id)}
        >
          <ArtworkProducts artwork={artwork} />
          <WikiSection title="Image">
            <ArtworkImageUpload
              artworkId={artwork.id}
              artworkSlug={artwork.slug}
              currentImagePath={artwork.imagePath}
              currentImageAlt={artwork.imageAlt}
              getUploadUrlAction={getArtworkImageUploadUrlAction}
              uploadAction={uploadArtworkImageAction}
            />
          </WikiSection>
          <WikiSection title="Linked products">
            <LinkedProductsEditor
              artworkId={artwork.id}
              allProducts={allProducts}
              initialLinkedProducts={artwork.products}
              linkAction={linkArtworkProductAction}
              unlinkAction={unlinkArtworkProductAction}
            />
          </WikiSection>
        </WikiEditableArtwork>
      ) : (
        <WikiArticle
          title={artwork.title}
          subtitle="From the Weird Strange Archive"
          body={<ArticleBody text={artwork.description} />}
          infobox={<ArtworkInfobox artwork={artwork} />}
        >
          <ArtworkProducts artwork={artwork} />
        </WikiArticle>
      )}
    </>
  );
}
