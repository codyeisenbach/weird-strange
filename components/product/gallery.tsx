"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageIndex = searchParams.has("image")
    ? parseInt(searchParams.get("image")!)
    : 0;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
  });

  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    // Touch-only dragging: mouse drags are left alone so the existing
    // desktop click-to-zoom affordance keeps working without Embla
    // intercepting the mousedown as a slide-drag.
    watchDrag: (_, event) => event.type === "touchstart",
  });

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const zoomedImageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  // Keep the main-image carousel's position in sync with imageIndex, which
  // is the single source of truth (driven by the URL search param).
  useEffect(() => {
    if (!emblaMainApi) return;
    if (emblaMainApi.selectedScrollSnap() === imageIndex) return;
    emblaMainApi.scrollTo(imageIndex);
  }, [emblaMainApi, imageIndex]);

  // Drive imageIndex from Embla's own drag/swipe selection, so a finger
  // drag both moves the image in real time (Embla's native behavior) and
  // updates the URL param that everything else (thumbnails, arrows) reads.
  useEffect(() => {
    if (!emblaMainApi) return;
    const onSelect = () => {
      updateImage(emblaMainApi.selectedScrollSnap().toString());
    };
    emblaMainApi.on("select", onSelect);
    return () => {
      emblaMainApi.off("select", onSelect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaMainApi]);

  const pointToZoomOrigin = (event: { clientX: number; clientY: number }) => {
    const container = imageContainerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (zoom) {
      setZoom(null);
      return;
    }

    const origin = pointToZoomOrigin(event);
    if (origin) setZoom(origin);
  };

  const handleImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const origin = pointToZoomOrigin(event);
    const image = zoomedImageRef.current;
    // Mutate the DOM directly instead of going through setZoom/React state:
    // re-rendering on every mousemove (dozens of times a second) plus
    // CSS-transitioning transform-origin fights the cursor and reads as
    // laggy/jerky. Writing the style straight to the element tracks the
    // cursor 1:1 with no transition and no React re-render in the loop.
    if (origin && image) {
      image.style.transformOrigin = `${origin.x}% ${origin.y}%`;
    }
  };

  useEffect(() => {
    setZoom(null);
  }, [imageIndex]);

  const updateImage = (index: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", index);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    emblaApi?.scrollTo(imageIndex);
  }, [emblaApi, imageIndex]);

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    "flex items-center justify-center p-1 text-ws-charcoal transition-transform ease-in-out active:scale-125 cursor-pointer lg:p-2";

  return (
    <div className="flex w-full flex-col justify-center items-center h-fit">
      <div className="relative -mx-16 flex w-full items-center gap-6 overflow-x-hidden md:-mx-16 lg:mx-0 lg:max-w-[750px] lg:overflow-visible">
        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => updateImage(previousImageIndex.toString())}
            aria-label="Previous product image"
            className={`${buttonClassName} absolute left-0 z-10 hidden rounded-full bg-ws-cream/80 backdrop-blur-sm lg:static lg:z-auto lg:flex lg:rounded-none lg:bg-transparent lg:backdrop-blur-none`}
          >
            <ArrowLeftIcon className="h-7 w-7" strokeWidth={2} />
          </button>
        ) : null}

        <div
          ref={imageContainerRef}
          className={`relative aspect-square h-full max-h-[550px] w-full touch-pan-y overflow-hidden lg:max-h-[750px] ${
            zoom ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
        >
          <div ref={emblaMainRef} className="h-full w-full overflow-hidden">
            <div className="flex h-full">
              {images.map((image, index) => {
                const isActive = index === imageIndex;

                return (
                  <div
                    key={image.src}
                    className="relative h-full w-full flex-none"
                    onClick={isActive ? handleImageClick : undefined}
                    onMouseMove={isActive ? handleImageMouseMove : undefined}
                  >
                    <Image
                      ref={isActive ? zoomedImageRef : undefined}
                      className="h-full w-full object-contain"
                      style={
                        isActive && zoom
                          ? {
                              transform: "scale(2.5)",
                              transformOrigin: `${zoom.x}% ${zoom.y}%`,
                              transition: "transform 300ms ease-out",
                            }
                          : { transition: "transform 300ms ease-out" }
                      }
                      fill
                      sizes="(min-width: 1024px) 66vw, 100vw"
                      alt={image.altText}
                      src={image.src}
                      priority={isActive}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => updateImage(nextImageIndex.toString())}
            aria-label="Next product image"
            className={`${buttonClassName} absolute right-0 z-10 hidden rounded-full bg-ws-cream/80 backdrop-blur-sm lg:static lg:z-auto lg:flex lg:rounded-none lg:bg-transparent lg:backdrop-blur-none`}
          >
            <ArrowRightIcon className="h-7 w-7" strokeWidth={2} />
          </button>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="my-12 w-full max-w-[550px] lg:max-w-[750px]">
          <div className="relative">
            <button
              type="button"
              onClick={() => updateImage(previousImageIndex.toString())}
              aria-label="Previous product image"
              className={`${buttonClassName} absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-ws-cream/80 backdrop-blur-sm lg:hidden`}
              style={{ left: "calc(8px - 50vw + 50%)" }}
            >
              <ArrowLeftIcon className="h-7 w-7" strokeWidth={2} />
            </button>
            <div className="flex justify-center">
              <div
                ref={emblaRef}
                className="w-[264px] overflow-hidden lg:w-full"
              >
                <ul className="flex items-center gap-2 py-1">
                  {images.map((image, index) => {
                    const isActive = index === imageIndex;

                    return (
                      <li key={image.src} className="h-20 w-20 flex-none">
                        <button
                          type="button"
                          onClick={() => updateImage(index.toString())}
                          aria-label="Select product image"
                          className="h-full w-full cursor-pointer"
                        >
                          <GridTileImage
                            alt={image.altText}
                            src={image.src}
                            width={80}
                            height={80}
                            active={isActive}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateImage(nextImageIndex.toString())}
              aria-label="Next product image"
              className={`${buttonClassName} absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-ws-cream/80 backdrop-blur-sm lg:hidden`}
              style={{ right: "calc(8px - 50vw + 50%)" }}
            >
              <ArrowRightIcon className="h-7 w-7" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 lg:hidden">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => updateImage(index.toString())}
                aria-label={`Go to image ${index + 1}`}
                className={`h-2 w-2 cursor-pointer rounded-full transition-colors ${
                  index === imageIndex ? "bg-ws-charcoal" : "bg-ws-charcoal/25"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
