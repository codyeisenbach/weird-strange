"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type BannerCarouselImage = {
  src: string;
  alt?: string;
  href?: string;
};

export function BannerCarousel({
  images,
}: {
  images: BannerCarouselImage[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = Math.min(1, Math.max(0, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    onScroll();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  if (!images.length) return null;

  return (
    <div className="w-full">
      <div className="relative w-full">
        <div ref={emblaRef} className="overflow-hidden">
          <ul className="flex">
            {images.map((image, i) => {
              const slide = (
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt ?? ""}
                    fill
                    sizes="84vw"
                    className="object-cover"
                  />
                </div>
              );

              return (
                <li
                  key={`${image.src}${i}`}
                  className="w-[84%] flex-none px-2"
                >
                  {image.href ? (
                    <Link href={image.href}>{slide}</Link>
                  ) : (
                    slide
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="absolute left-[calc(8%-50px)] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeftIcon className="h-9 w-9 transition-transform ease-in-out active:scale-125" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className="absolute right-[calc(8%-50px)] top-1/2 z-10 translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRightIcon className="h-9 w-9 transition-transform ease-in-out active:scale-125" />
        </button>
      </div>

      <div className="mt-3 h-2.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-ws-charcoal"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
}
