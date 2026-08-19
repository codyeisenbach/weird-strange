import clsx from "clsx";
import { ProductCardThumbnails } from "components/grid/product-card-thumbnails";
import Price from "components/price";
import { withNonBreakingHyphens } from "lib/utils";
import { Product } from "lib/shopify/types";
import {
  getColorImage,
  getColorImages,
  getDefaultColor,
  getHoverImage,
  getVariantSearchParams,
} from "lib/shopify/variant-matching";
import Image from "next/image";
import Link from "next/link";

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
  disableThumbnailCarousel,
  ...props
}: {
  product: Product;
  // Skip the swipeable mobile thumbnail carousel and show a single static
  // image instead — needed when this card is itself rendered inside another
  // swipeable carousel, since a nested Embla instance fights the parent's
  // for horizontal drag/touch gestures.
  disableThumbnailCarousel?: boolean;
} & React.ComponentProps<"li">) {
  const color = getDefaultColor(product);
  const variantParams = getVariantSearchParams(product, color);
  const href = variantParams
    ? `/product/${product.handle}?${variantParams}`
    : `/product/${product.handle}`;
  const cardImage = getColorImage(product, color) ?? product.featuredImage;
  const hoverImage = getHoverImage(product, color);
  const carouselImages = getColorImages(product, color);

  return (
    <li {...props} className={clsx("transition-opacity", className)}>
      <Link href={href} prefetch={true} className="block">
        <div className="md:hidden">
          {disableThumbnailCarousel ? (
            <div className="relative aspect-[300/368] w-full overflow-hidden">
              {cardImage?.url ? (
                <Image
                  src={cardImage.url}
                  alt={cardImage.altText || product.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          ) : (
            <ProductCardThumbnails
              images={carouselImages}
              alt={product.title}
            />
          )}
        </div>
        <div className="group relative hidden aspect-[300/368] w-full overflow-hidden md:block">
          {cardImage?.url ? (
            <Image
              src={cardImage.url}
              alt={cardImage.altText || product.title}
              fill
              sizes="25vw"
              className="object-cover"
            />
          ) : null}
          {hoverImage ? (
            <Image
              src={hoverImage.url}
              alt={hoverImage.altText || product.title}
              fill
              sizes="25vw"
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
