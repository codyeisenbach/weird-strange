import { siteName, siteUrl } from "lib/site-config";
import type { ArtworkDetail } from "lib/archive/types";
import type { Collection, Product } from "./types";

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Builds the `isBasedOn` property linking a Product back to the archive
// artwork(s) its design is derived from — more precise than schema.org's
// `character` (which frames the artwork as depicted content, closer to
// "this character appears in this work") for a manufactured product whose
// design is literally sourced from the artwork. Nested with `creator`
// (Person, the artist) and `isPartOf` (CreativeWorkSeries, the
// publication). Deliberately excludes `image`: the only image in a
// Product's JSON-LD should be the actual product photo (`Product.image`
// below), not the source artwork's image — mixing in a second, unrelated
// image URL risks confusing Google's Product image requirements for rich
// results.
function buildArtworkIsBasedOn(artworks: ArtworkDetail[]) {
  if (artworks.length === 0) return undefined;

  const isBasedOn = artworks.map((artwork) => ({
    "@type": "CreativeWork",
    name: artwork.title,
    description: artwork.description || undefined,
    creator: {
      "@type": "Person",
      name: artwork.artist.name,
      url: `${siteUrl}/archive/artists/${artwork.artist.slug}`,
    },
    isPartOf: artwork.publication
      ? {
          "@type": "CreativeWorkSeries",
          name: artwork.publication.title,
          url: `${siteUrl}/archive/publications/${artwork.publication.slug}`,
          // Free text (e.g. "Nov 1942", "Fall 42"), not strict ISO 8601 —
          // schema.org's Date properties accept plain Text values, so this
          // is still valid markup, just not machine-parseable for
          // date-sensitive rich-result features the way a real ISO date
          // would be.
          datePublished: artwork.publication.issueDate || undefined,
        }
      : undefined,
  }));

  return isBasedOn.length === 1 ? isBasedOn[0] : isBasedOn;
}

export function buildProductJsonLd(
  product: Product,
  url: string,
  artworks: ArtworkDetail[] = [],
) {
  const variants = product.variants.length
    ? product.variants
    : [
        {
          id: product.id,
          title: product.title,
          availableForSale: product.availableForSale,
          sku: "",
          selectedOptions: [],
          price: product.priceRange.minVariantPrice,
          compareAtPrice: null,
          image: null,
        },
      ];

  const offers = variants.map((variant) => ({
    "@type": "Offer",
    sku: variant.sku || undefined,
    url,
    price: variant.price.amount,
    priceCurrency: variant.price.currencyCode,
    availability: variant.availableForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((image) => image.url),
    sku: variants[0]?.sku || undefined,
    brand: product.vendor
      ? { "@type": "Brand", name: product.vendor }
      : undefined,
    url,
    offers:
      offers.length === 1 ? offers[0] : { "@type": "AggregateOffer", offers },
    isBasedOn: buildArtworkIsBasedOn(artworks),
  };
}

export function buildCollectionJsonLd(collection: Collection, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `${collection.title} products`,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  };
}
