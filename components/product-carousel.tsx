"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { ProductCards } from "components/grid";
import useEmblaCarousel from "embla-carousel-react";
import { Product } from "lib/shopify/types";
import { useCallback, useEffect, useState } from "react";

export function ProductCarousel({ products }: { products: Product[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!products.length) return null;

  const buttonClasses =
    "flex h-11 w-11 items-center justify-center border border-ws-charcoal text-ws-charcoal transition-opacity disabled:opacity-30";

  return (
    <div className="relative w-full">
      <div ref={emblaRef} className="overflow-hidden">
        <ul className="flex gap-4">
          {products.map((product) => (
            <ProductCards
              key={product.handle}
              product={product}
              className="flex-none"
            />
          ))}
        </ul>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          aria-label="Previous products"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className={buttonClasses}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next products"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className={buttonClasses}
        >
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
