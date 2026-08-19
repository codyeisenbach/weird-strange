import Grid, { ProductCards } from "components/grid";
import { ImageBanner } from "components/image-banner";
import { Product } from "lib/shopify/types";

export function ProductBanner({ product }: { product: Product | undefined }) {
  return (
    <>
      <h2 className="mb-6 text-right text-6xl pt-8 font-bold text-ws-charcoal">
        BLACK PRIESTESS OF VARDA
      </h2>
      <Grid className="items-stretch md:grid-cols-4">
        <li className="min-w-0 md:col-span-3">
          <ImageBanner
            src="https://images.weirdstrange.com/banners/home-banner.png"
            href="/search"
            alt="Shop the collection"
          />
        </li>
        {product ? (
          <ProductCards
            product={product}
            className="border border-ws-border md:col-span-1"
          />
        ) : null}
      </Grid>
    </>
  );
}
