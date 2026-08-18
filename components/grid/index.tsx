import clsx from "clsx";
import Price from "components/price";
import { Product } from "lib/shopify/types";
import {
  getColorImage,
  getDefaultColor,
  getHoverImage,
  getVariantSearchParams,
} from "lib/shopify/variant-matching";
import Image from "next/image";
import Link from "next/link";

// Browsers treat every hyphen as a valid line-break point, so a title like
// "Astounding Science Fiction 9-1947" can wrap right after the "9-" even
// with normal word wrapping. Swapping in the non-breaking hyphen (U+2011)
// keeps hyphenated segments glued together while leaving ordinary spaces
// free to wrap as usual.
function withNonBreakingHyphens(text: string) {
  return text.replace(/-/g, "‑");
}

function Grid(props: React.ComponentProps<"ul">) {
  return (
    <ul
      {...props}
      className={clsx("grid grid-flow-row gap-4", props.className)}
    >
      {props.children}
    </ul>
  );
}

function ProductCards({
  product,
  className,
  ...props
}: {
  product: Product;
} & React.ComponentProps<"li">) {
  const color = getDefaultColor(product);
  const variantParams = getVariantSearchParams(product, color);
  const href = variantParams
    ? `/product/${product.handle}?${variantParams}`
    : `/product/${product.handle}`;
  const cardImage = getColorImage(product, color) ?? product.featuredImage;
  const hoverImage = getHoverImage(product, color);

  return (
    <li {...props} className={clsx("transition-opacity", className)}>
      <Link href={href} prefetch={true} className="block">
        <div className="group relative aspect-[300/368] w-full overflow-hidden">
          {cardImage?.url ? (
            <Image
              src={cardImage.url}
              alt={cardImage.altText || product.title}
              fill
              sizes="(min-width: 768px) 25vw, 300px"
              className="object-cover"
            />
          ) : null}
          {hoverImage ? (
            <Image
              src={hoverImage.url}
              alt={hoverImage.altText || product.title}
              fill
              sizes="(min-width: 768px) 25vw, 300px"
              className="object-cover opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-hover:duration-300"
            />
          ) : null}
        </div>
        <div className="mt-2 flex w-full gap-4 justify-between px-2">
          <h3 className="min-w-0 shrink text-sm font-medium break-normal text-ws-charcoal">
            {withNonBreakingHyphens(product.title)}
          </h3>
          <Price
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            className="text-sm text-ws-charcoal"
          />
        </div>
      </Link>
      {product.descriptionHtml ? (
        <div
          className="prose-sm max-w-none px-2 py-2 text-xs text-neutral-500 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-p:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      ) : null}
    </li>
  );
}

Grid.ProductCards = ProductCards;

export { ProductCards };
export default Grid;
