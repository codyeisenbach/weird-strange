import { BannerCarousel } from "components/banner-carousel";
import { Carousel } from "components/carousel";
import Grid, { ProductCards } from "components/grid";
import { ThreeItemGrid } from "components/grid/three-items";
import { ImageBanner } from "components/image-banner";
import Footer from "components/layout/footer";
import { ProductCarousel } from "components/product-carousel";
import { getCollectionProducts, getProducts } from "lib/shopify";

export const metadata = {
  description:
    "High-performance ecommerce store built with Next.js, Vercel, and Shopify.",
  openGraph: {
    type: "website",
  },
};

// TODO: swap for real marketing banner images once they exist.
const PLACEHOLDER_BANNER_IMAGES = [
  {
    src: "https://images.weirdstrange.com/banners/home-banner.png",
    alt: "Placeholder banner 1",
  },
  {
    src: "https://images.weirdstrange.com/banners/home-banner.png",
    alt: "Placeholder banner 2",
  },
  {
    src: "https://images.weirdstrange.com/banners/home-banner.png",
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
      <div className="px-8 pt-8 w-full my-4">
        <BannerCarousel images={PLACEHOLDER_BANNER_IMAGES} />
      </div>
      <div className="px-8 w-full">
        <Grid className="items-stretch md:grid-cols-4">
          <li className="min-w-0 md:col-span-3">
            <ImageBanner
              src="https://images.weirdstrange.com/banners/home-banner.png"
              href="/search"
              alt="Shop the collection"
            />
          </li>
          {carouselProducts[0] ? (
            <ProductCards
              product={carouselProducts[0]}
              className="border border-ws-border md:col-span-1"
            />
          ) : null}
        </Grid>
        <ProductCarousel products={carouselProducts} />
      </div>
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}
