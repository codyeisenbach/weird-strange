"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Image as ShopifyImage } from "lib/shopify/types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// Swipeable thumbnail carousel for a product card on mobile, where there's
// no hover to reveal the second (hover-role) image. Desktop keeps the
// existing stacked hover-swap image pair instead — see ProductCards below.
export function ProductCardThumbnails({
  images,
  alt,
}: {
  images: ShopifyImage[];
  alt: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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

  if (!images.length) return null;

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <ul className="flex">
          {images.map((image, i) => (
            <li
              key={image.id ?? image.url}
              className="relative aspect-[300/368] w-full flex-none"
            >
              <Image
                src={image.url}
                alt={image.altText || alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </li>
          ))}
        </ul>
      </div>
      {images.length > 1 ? (
        <div className="flex justify-center gap-1.5 py-4">
          {images.map((image, i) => (
            <span
              key={image.id ?? image.url}
              className={`h-2 w-2 rounded-full ${
                i === selectedIndex ? "bg-ws-charcoal" : "bg-ws-charcoal/25"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
