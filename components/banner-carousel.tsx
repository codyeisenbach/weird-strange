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

export function BannerCarousel({ images }: { images: BannerCarouselImage[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
      <div className="relative -mx-8 w-[calc(100%+4rem)] md:mx-0 md:w-full">
        <div ref={emblaRef} className="overflow-hidden">
          <ul className="flex">
            {images.map((image, i) => {
              const slide = (
                <div className="relative aspect-4/5 w-full overflow-hidden md:aspect-video">
                  <Image
                    src={image.src}
                    alt={image.alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 84vw, 100vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              );

              return (
                <li
                  key={`${image.src}${i}`}
                  className="w-full flex-none md:w-[84%] md:px-2"
                >
                  {image.href ? <Link href={image.href}>{slide}</Link> : slide}
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
          className="absolute left-[calc(8%-50px)] top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 cursor-pointer text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-opacity disabled:pointer-events-none disabled:opacity-0 md:block"
        >
          <ChevronLeftIcon className="h-9 w-9 transition-transform ease-in-out active:scale-125" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className="absolute right-[calc(8%-50px)] top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 cursor-pointer text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-opacity disabled:pointer-events-none disabled:opacity-0 md:block"
        >
          <ChevronRightIcon className="h-9 w-9 transition-transform ease-in-out active:scale-125" />
        </button>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2 px-8 md:hidden">
          {images.map((image, i) => (
            <button
              key={`${image.src}${i}`}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 w-2 cursor-pointer rounded-full transition-colors ${
                i === selectedIndex ? "bg-ws-charcoal" : "bg-ws-charcoal/25"
              }`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-3 hidden h-2.5 w-full rounded-full bg-gray-200 md:block">
        <div
          className="h-full rounded-full bg-ws-charcoal"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
}
