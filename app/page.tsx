import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import { ImageBanner } from "components/image-banner";
import Footer from "components/layout/footer";

export const metadata = {
  description:
    "High-performance ecommerce store built with Next.js, Vercel, and Shopify.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <ImageBanner
        src="https://images.weirdstrange.com/banners/home-banner.png"
        href="/search"
        alt="Shop the collection"
      />
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}
