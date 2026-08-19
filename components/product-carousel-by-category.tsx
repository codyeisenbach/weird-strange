import { ProductCarouselView } from "components/product-carousel";
import { getCollectionProducts, getProducts } from "lib/shopify";

// "Category" maps to a Shopify collection handle — this repo has no separate
// category/productType/tag grouping concept (see CategoryPage in
// app/collections/[collection]/page.tsx, which is the same mapping).
export async function ProductCarouselByCategory({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  // Prefer the curated collection; fall back to the full catalog until it exists.
  const collectionProducts = await getCollectionProducts({
    collection: category,
  });
  const products = collectionProducts.length
    ? collectionProducts
    : await getProducts({});

  return <ProductCarouselView title={title} products={products} />;
}
