import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import Link from "next/link";
import type { ArtworkDetail } from "lib/archive/types";
import { Product, ProductVariant } from "lib/shopify/types";
import { VariantSelector } from "./variant-selector";
import { ViewItemTracker } from "./view-item-tracker";

// Archive attribution shown above the Shopify description — artist,
// publication, and issue date for the artwork this product's design is
// based on (see getArtworksForProductHandle / buildProductJsonLd's
// isBasedOn, which surface the same underlying data as structured data).
// Renders nothing if the product has no linked artwork, and each line
// individually if that field is unset on the archive side (e.g. no
// publication, or a publication with no issue date) — same "omit rather
// than show empty" convention used throughout the archive/structured-data
// code.
function ArtworkAttribution({ artworks }: { artworks: ArtworkDetail[] }) {
  const artwork = artworks[0];
  if (!artwork) return null;

  return (
    <div className="mb-6 text-sm leading-tight text-ws-charcoal/70">
      <p>
        Artist:{" "}
        <Link
          href={`/archive/artists/${artwork.artist.slug}`}
          className="underline hover:text-ws-charcoal"
        >
          {artwork.artist.name}
        </Link>
      </p>
      {artwork.publication ? (
        <p>
          Publication:{" "}
          <Link
            href={`/archive/publications/${artwork.publication.slug}`}
            className="underline hover:text-ws-charcoal"
          >
            {artwork.publication.title}
          </Link>
        </p>
      ) : null}
      {artwork.publication?.issueDate ? (
        <p>Date: {artwork.publication.issueDate}</p>
      ) : null}
    </div>
  );
}

export function ProductHeader({ product }: { product: Product }) {
  const price = product.priceRange.maxVariantPrice;
  const compareAtPrice = product.compareAtPriceRange?.maxVariantPrice;
  const hasDiscount =
    compareAtPrice &&
    parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  return (
    <div className="mb-6 flex flex-col lg:border-b border-ws-border/20 pb-6">
      <h1 className="mb-6 text-3xl font-medium lg:text-5xl">{product.title}</h1>
      <div className="inline-flex w-fit items-center gap-3 bg-ws-charcoal px-4 py-2">
        {hasDiscount ? (
          <Price
            className="text-xl font-light text-red-600 line-through lg:text-3xl"
            amount={compareAtPrice.amount}
            currencyCode={compareAtPrice.currencyCode}
          />
        ) : null}
        <Price
          className="text-2xl font-light text-white lg:text-4xl"
          amount={price.amount}
          currencyCode={price.currencyCode}
        />
      </div>
    </div>
  );
}

export function ProductDescription({
  product,
  selectedVariant,
  artworks = [],
}: {
  product: Product;
  selectedVariant?: ProductVariant;
  artworks?: ArtworkDetail[];
}) {
  return (
    <>
      <ViewItemTracker product={product} variant={selectedVariant} />
      <VariantSelector options={product.options} variants={product.variants} />
      <ArtworkAttribution artworks={artworks} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight text-ws-charcoal/70"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
