import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { Product, ProductVariant } from "lib/shopify/types";
import { VariantSelector } from "./variant-selector";
import { ViewItemTracker } from "./view-item-tracker";

export function ProductHeader({ product }: { product: Product }) {
  const price = product.priceRange.maxVariantPrice;
  const compareAtPrice = product.compareAtPriceRange?.maxVariantPrice;
  const hasDiscount =
    compareAtPrice &&
    parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  return (
    <div className="mb-6 flex flex-col lg:border-b border-ws-border/20 pb-6">
      <h1 className="mb-6 text-3xl font-medium lg:text-5xl">{product.title}</h1>
      <div className="inline-flex w-fit items-center gap-3 bg-ws-charcoal px-4 py-2">
        {hasDiscount ? (
          <Price
            className="text-xl font-light text-red-600 line-through lg:text-3xl"
            amount={compareAtPrice.amount}
            currencyCode={compareAtPrice.currencyCode}
          />
        ) : null}
        <Price
          className="text-2xl font-light text-white lg:text-4xl"
          amount={price.amount}
          currencyCode={price.currencyCode}
        />
      </div>
    </div>
  );
}

export function ProductDescription({
  product,
  selectedVariant,
}: {
  product: Product;
  selectedVariant?: ProductVariant;
}) {
  return (
    <>
      <ViewItemTracker product={product} variant={selectedVariant} />
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight text-ws-charcoal/70"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
