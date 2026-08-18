"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Image as ShopifyImage } from "lib/shopify/types";
import Image from "next/image";

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
  const [emblaRef] = useEmblaCarousel({ align: "start" });

  if (!images.length) return null;

  return (
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
  );
}
