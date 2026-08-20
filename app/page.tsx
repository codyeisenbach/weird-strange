import {
  BannerCarousel,
  BannerCarouselImage,
} from "components/banner-carousel";
import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import { ProductBanner } from "components/product-banner";
import { ProductCarouselByCategory } from "components/product-carousel-by-category";
import { getCollectionProducts, getProducts } from "lib/shopify";

export const metadata = {
  description:
    "High-performance ecommerce store built with Next.js, Vercel, and Shopify.",
  openGraph: {
    type: "website",
  },
};

// TODO: swap for real marketing banner images once they exist. Both sources
// in each pair are placeholders from picsum.photos (see the TEMPORARY
// remotePattern in next.config.ts) — landscape for desktop, portrait for
// mobile — so the aspect-ratio picker in BannerCarousel has a genuinely
// distinct candidate for each breakpoint instead of the same image twice.
// Replace both URLs in each pair with real desktop/mobile crops when they
// exist, then remove the picsum.photos remotePattern.
const PLACEHOLDER_BANNER_IMAGES: BannerCarouselImage[] = [
  {
    sources: [
      "https://picsum.photos/seed/ws-banner-1/1600/900",
      "https://picsum.photos/seed/ws-banner-1/900/1600",
    ],
    alt: "Placeholder banner 1",
  },
  {
    sources: [
      "https://picsum.photos/seed/ws-banner-2/1600/900",
      "https://picsum.photos/seed/ws-banner-2/900/1600",
    ],
    alt: "Placeholder banner 2",
  },
  {
    sources: [
      "https://picsum.photos/seed/ws-banner-3/1600/900",
      "https://picsum.photos/seed/ws-banner-3/900/1600",
    ],
    alt: "Placeholder banner 3",
  },
];

export default async function HomePage() {
  // Prefer the curated collection; fall back to the full catalog until it exists.
  const collectionProducts = await getCollectionProducts({
    collection: "hidden-homepage-carousel",
  });
  const carouselProducts = collectionProducts.length
    ? collectionProducts
    : await getProducts({});

  return (
    <>
      <div className="px-4 sm:px-8 pt-0 sm:pt-6 w-full my-0 sm:my-4">
        <h2 className="mb-2 sm:mb-6 text-3xl sm:text-6xl font-bold text-ws-charcoal">
          HIGH FIDELITY ARCHIVE
        </h2>
        <BannerCarousel images={PLACEHOLDER_BANNER_IMAGES} />
      </div>
      <div className="px-8 w-full">
        <ProductCarouselByCategory title="Pulp Sci-Fi" category="pulp-sci-fi" />
        <ProductCarouselByCategory title="All" category="all" />
        <ProductBanner
          product={carouselProducts[0] ? carouselProducts[0] : undefined}
        />
      </div>
      <ThreeItemGrid />
      <Carousel />
    </>
  );
}
