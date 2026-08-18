"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import useEmblaCarousel from "embla-carousel-react";
import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type BannerCarouselImage = {
  // One or more candidate photos for this slide. When more than one is
  // given, each is measured client-side and the most portrait one is used
  // on mobile, the most landscape one on desktop — there's no merchant-set
  // "this is the mobile crop" tag to read (see the filename-role convention
  // in lib/shopify/variant-matching.ts for why that's the usual approach
  // here), so orientation is inferred from the actual pixels instead. A
  // single-candidate slide renders that one image at every breakpoint.
  sources: [string, ...string[]];
  alt?: string;
  href?: string;
};

// Loads an image off-DOM just to read its natural dimensions, without
// rendering it — used to classify sources by orientation before deciding
// which one next/image should actually render.
function probeImageSize(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Picks the most portrait source (smallest width/height ratio) for mobile
// and the most landscape one (largest ratio) for desktop. Falls back to the
// first source for both when there's only one candidate, or when none of
// them load in time to be measured.
function useResponsiveSource(sources: [string, ...string[]]) {
  const [mobileSrc, setMobileSrc] = useState(sources[0]);
  const [desktopSrc, setDesktopSrc] = useState(sources[0]);

  useEffect(() => {
    if (sources.length < 2) {
      setMobileSrc(sources[0]);
      setDesktopSrc(sources[0]);
      return;
    }

    let cancelled = false;

    Promise.all(
      sources.map((src) => probeImageSize(src).then((size) => ({ src, size }))),
    ).then((results) => {
      if (cancelled) return;
      const measured = results.filter(
        (r): r is { src: string; size: { width: number; height: number } } =>
          r.size !== null,
      );
      if (!measured.length) return;

      const byRatio = measured
        .map((r) => ({ src: r.src, ratio: r.size.width / r.size.height }))
        .sort((a, b) => a.ratio - b.ratio);

      setMobileSrc(byRatio[0]!.src);
      setDesktopSrc(byRatio[byRatio.length - 1]!.src);
    });

    return () => {
      cancelled = true;
    };
  }, [sources]);

  return { mobileSrc, desktopSrc };
}

// Tracks Tailwind's `md` breakpoint (768px) so BannerImage can mount only
// one next/image at a time instead of rendering both crops and hiding one
// with CSS, which would still download both. Starts `false` (mobile) to
// match server-rendered markup and avoid a hydration mismatch, then
// corrects itself immediately after mount.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    setIsDesktop(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function BannerImage({
  image,
  priority,
}: {
  image: BannerCarouselImage;
  priority: boolean;
}) {
  const { mobileSrc, desktopSrc } = useResponsiveSource(image.sources);
  const isDesktop = useIsDesktop();

  return (
    <div className="relative aspect-4/5 w-full overflow-hidden md:aspect-video">
      <NextImage
        src={isDesktop ? desktopSrc : mobileSrc}
        alt={image.alt ?? ""}
        fill
        sizes="(min-width: 768px) 84vw, 100vw"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}

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
              const slide = <BannerImage image={image} priority={i === 0} />;

              return (
                <li
                  key={`${image.sources[0]}${i}`}
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
              key={`${image.sources[0]}${i}`}
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
