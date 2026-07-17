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
      <div className="px-8">
        <Grid className="grid-cols-4 items-stretch">
          <li className="col-span-3 min-w-0">
            <ImageBanner
              src="https://images.weirdstrange.com/banners/home-banner.png"
              href="/search"
              alt="Shop the collection"
            />
          </li>
          {carouselProducts[0] ? (
            <ProductCards product={carouselProducts[0]} className="col-span-1 my-4" />
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
