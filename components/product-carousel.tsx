"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { ProductCards } from "components/grid";
import useEmblaCarousel from "embla-carousel-react";
import { Product } from "lib/shopify/types";

export function ProductCarousel({ products }: { products: Product[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });

  if (!products.length) return null;

  const buttonClasses =
    "flex items-center justify-center p-1 text-ws-charcoal transition-transform ease-in-out active:scale-125 cursor-pointer lg:p-2 rounded-full bg-ws-cream/80 backdrop-blur-sm";

  return (
    <div className="relative w-full my-4">
      <div ref={emblaRef} className="overflow-hidden">
        <ul className="flex gap-4">
          {products.map((product) => (
            <ProductCards
              key={product.handle}
              product={product}
              className="w-[300px] flex-none"
            />
          ))}
        </ul>
      </div>
      {products.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => emblaApi?.scrollPrev()}
            className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 ${buttonClasses}`}
          >
            <ArrowLeftIcon className="h-7 w-7" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => emblaApi?.scrollNext()}
            className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 ${buttonClasses}`}
          >
            <ArrowRightIcon className="h-7 w-7" strokeWidth={2} />
          </button>
        </>
      ) : null}
    </div>
  );
}
