import { GridTileImage } from "components/grid/tile";
import { JsonLd } from "components/seo/json-ld";
import { Gallery } from "components/product/gallery";
import {
  ProductDescription,
  ProductHeader,
} from "components/product/product-description";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { siteUrl } from "lib/site-config";
import { getArtworksForProductHandle } from "lib/archive";
import { getProduct, getProductRecommendations } from "lib/shopify";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "lib/shopify/structured-data";
import type { Image } from "lib/shopify/types";
import {
  getColorImage,
  getColorOption,
  getDefaultColor,
  getVariantSearchParams,
  isColorTagged,
  matchesColor,
} from "lib/shopify/variant-matching";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const [product, artworks] = await Promise.all([
    getProduct(params.handle),
    getArtworksForProductHandle(params.handle),
  ]);

  if (!product) return notFound();

  const colorOption = getColorOption(product.options);
  const selectedColor = colorOption
    ? ((searchParams[colorOption.name.toLowerCase()] as string) ??
      colorOption.values[0])
    : undefined;
  const selectedVariant = selectedColor
    ? product.variants.find((variant) =>
        variant.selectedOptions.some(
          (option) =>
            option.name.toLowerCase() === "color" &&
            option.value === selectedColor,
        ),
      )
    : undefined;

  const filteredImages = selectedColor
    ? product.images.filter(
        (image) =>
          !isColorTagged(image.altText, colorOption) ||
          matchesColor(image.altText, selectedColor),
      )
    : product.images;

  // A variant with no image of its own falls back to the product's
  // featuredImage from the Storefront API, so exclude that case here —
  // otherwise every imageless variant would appear to "own" featuredImage
  // and dedupe it out of the rest of the gallery.
  const selectedVariantImage =
    selectedVariant?.image?.url === product.featuredImage?.url
      ? undefined
      : selectedVariant?.image;

  const galleryImages = selectedVariantImage
    ? [
        selectedVariantImage,
        ...filteredImages.filter((image) =>
          selectedVariantImage.id
            ? image.id !== selectedVariantImage.id
            : image.url !== selectedVariantImage.url,
        ),
      ]
    : filteredImages;

  const productUrl = `${siteUrl}/product/${product.handle}`;
  const productJsonLd = buildProductJsonLd(product, productUrl, artworks);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: product.title, url: productUrl },
  ]);

  return (
    <>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-1 md:px-4">
        <div className="flex flex-col bg-ws-cream px-4 py-2 text-ws-charcoal md:p-12 lg:flex-row lg:gap-24">
          <div className="lg:hidden">
            <ProductHeader product={product} />
          </div>

          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative -mx-12 aspect-square h-full max-h-[550px] w-full overflow-hidden md:-mx-16 lg:mx-0 lg:max-h-[750px]" />
              }
            >
              <Gallery
                images={galleryImages.map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <div className="hidden lg:block">
              <ProductHeader product={product} />
            </div>
            <Suspense fallback={null}>
              <ProductDescription
                product={product}
                selectedVariant={selectedVariant}
                artworks={artworks}
              />
            </Suspense>
          </div>
        </div>
        <RelatedProducts id={product.id} />
      </div>
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8 px-4">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => {
          const color = getDefaultColor(product);
          const variantParams = getVariantSearchParams(product, color);
          const href = variantParams
            ? `/product/${product.handle}?${variantParams}`
            : `/product/${product.handle}`;
          const relatedImage =
            getColorImage(product, color) ?? product.featuredImage;

          return (
            <li
              key={product.handle}
              className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            >
              <Link
                className="relative h-full w-full"
                href={href}
                prefetch={true}
              >
                <GridTileImage
                  alt={relatedImage?.altText || product.title}
                  label={{
                    title: product.title,
                    amount: product.priceRange.maxVariantPrice.amount,
                    currencyCode:
                      product.priceRange.maxVariantPrice.currencyCode,
                  }}
                  src={relatedImage?.url}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
