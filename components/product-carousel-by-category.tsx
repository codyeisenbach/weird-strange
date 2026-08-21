import { ProductCarouselView } from "components/product-carousel";
import { defaultSort } from "lib/constants";
import { getCollection, getCollectionProducts, getProducts } from "lib/shopify";

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
  // Pass defaultSort's sortKey/reverse explicitly so this hits the exact
  // same "use cache" entry as CategoryPage's own unsorted view of the same
  // collection (Next keys cache entries by actual argument values — leaving
  // these undefined here previously created a second, separately-expiring
  // cache entry for the same collection).
  const [collection, collectionProducts] = await Promise.all([
    getCollection(category),
    getCollectionProducts({
      collection: category,
      sortKey: defaultSort.sortKey,
      reverse: defaultSort.reverse,
    }),
  ]);
  const products = collectionProducts.length
    ? collectionProducts
    : await getProducts({});

  return (
    <ProductCarouselView title={collection?.title ?? title} products={products} />
  );
}
