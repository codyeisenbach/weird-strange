import { siteName, siteUrl } from "lib/site-config";
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

export function buildProductJsonLd(product: Product, url: string) {
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
      offers.length === 1
        ? offers[0]
        : { "@type": "AggregateOffer", offers },
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
