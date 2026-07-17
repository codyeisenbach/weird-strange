import Grid from "components/grid";
import { Product } from "lib/shopify/types";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  return (
    <>
      {products.map((product) => (
        <Grid.ProductCards
          key={product.handle}
          product={product}
          className="animate-fadeIn"
        />
      ))}
    </>
  );
}
