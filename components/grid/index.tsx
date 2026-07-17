import clsx from "clsx";
import Price from "components/price";
import { Product } from "lib/shopify/types";
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
  ...props
}: {
  product: Product;
} & React.ComponentProps<"li">) {
  return (
    <li {...props} className={clsx("transition-opacity", className)}>
      <Link
        href={`/product/${product.handle}`}
        prefetch={true}
        className="block"
      >
        <div className="relative aspect-[300/368] w-full overflow-hidden border border-ws-charcoal">
          {product.featuredImage?.url ? (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 25vw, 300px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="mt-2 flex w-full flex-col gap-1">
          <h3 className="text-sm font-medium text-ws-charcoal">
            {product.title}
          </h3>
          <Price
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            className="text-sm text-ws-charcoal"
          />
          {product.descriptionHtml ? (
            <div
              className="prose-sm max-w-none text-xs text-neutral-500 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-p:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : null}
        </div>
      </Link>
    </li>
  );
}

Grid.ProductCards = ProductCards;

export { ProductCards };
export default Grid;
