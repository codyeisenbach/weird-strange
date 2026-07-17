import { Carousel } from "components/carousel";
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
      <ImageBanner
        src="https://images.weirdstrange.com/banners/home-banner.png"
        href="/search"
        alt="Shop the collection"
      />
      <ProductCarousel products={carouselProducts} />
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}
