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
    align: "start",
    containScroll: "trimSnaps",
  });

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const [slide, setSlide] = useState<{
    id: number;
    fromIndex: number;
    direction: "left" | "right";
    entering: boolean;
  } | null>(null);
  const previousIndexRef = useRef(imageIndex);
  const slideTokenRef = useRef(0);

  // Computed synchronously during render (React's "adjusting state while
  // rendering" pattern) rather than in a useEffect. An effect runs *after*
  // the browser paints the render that already shows the new imageIndex, so
  // there'd be one painted frame with the new image at full opacity and no
  // slide wrapper yet — a visible flash before the animation kicks in.
  if (previousIndexRef.current !== imageIndex) {
    const previousIndex = previousIndexRef.current;
    const isNext =
      imageIndex === (previousIndex + 1) % images.length &&
      previousIndex !== images.length - 1;
    const isWrapToStart =
      previousIndex === images.length - 1 && imageIndex === 0;
    const direction = isNext || isWrapToStart ? "right" : "left";

    previousIndexRef.current = imageIndex;
    // `id` (not just `fromIndex`/`imageIndex`) drives the React `key` below
    // so every transition mounts fresh DOM nodes — once the carousel loops,
    // index-based keys repeat and React reuses the old element instead of
    // remounting it, which skips the "jump to off-screen start" paint and
    // silently breaks the animation.
    setSlide({
      id: ++slideTokenRef.current,
      fromIndex: previousIndex,
      direction,
      entering: true,
    });
  }

  useEffect(() => {
    if (!slide || !slide.entering) return;

    const token = slide.id;
    // Two nested rAFs guarantee the browser has painted the "entering"
    // (off-screen) position before we flip it, so the transition actually
    // has a starting point to animate from instead of snapping instantly.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setSlide((current) =>
          current?.id === token ? { ...current, entering: false } : current,
        );
      });
    });
    const timeout = setTimeout(() => {
      setSlide((current) => (current?.id === token ? null : current));
    }, 500);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
  }, [slide]);

  const pointToZoomOrigin = (event: {
    clientX: number;
    clientY: number;
  }) => {
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
    if (origin) setZoom(origin);
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
    "flex items-center justify-center p-2 text-ws-charcoal transition-transform ease-in-out active:scale-125 cursor-pointer";

  return (
    <form>
      <div className="flex w-full flex-col justify-center items-center h-fit">
        <div className="flex w-full max-w-[550px] items-center gap-6">
          {images.length > 1 ? (
            <button
              formAction={() => updateImage(previousImageIndex.toString())}
              aria-label="Previous product image"
              className={buttonClassName}
            >
              <ArrowLeftIcon className="h-7 w-7" strokeWidth={2} />
            </button>
          ) : null}

          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            onMouseMove={handleImageMouseMove}
            className={`relative aspect-square h-full max-h-[550px] w-full overflow-hidden ${
              zoom ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
          >
            {slide && images[slide.fromIndex] && (
              <div
                key={`outgoing-${slide.id}`}
                className="absolute inset-0"
                style={{
                  transition:
                    "transform 500ms ease-out, opacity 200ms ease-out",
                  transform: `translateX(${
                    slide.entering
                      ? "0"
                      : slide.direction === "right"
                        ? "-100%"
                        : "100%"
                  })`,
                  opacity: slide.entering ? 1 : 0,
                }}
              >
                <Image
                  className="h-full w-full object-contain"
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  alt={images[slide.fromIndex]?.altText as string}
                  src={images[slide.fromIndex]?.src as string}
                />
              </div>
            )}
            {images[imageIndex] && (
              <div
                key={slide ? `current-${slide.id}` : `current-${imageIndex}`}
                className="absolute inset-0"
                style={
                  slide
                    ? {
                        transition:
                          "transform 500ms ease-out, opacity 200ms ease-out",
                        transform: `translateX(${
                          slide.entering
                            ? slide.direction === "right"
                              ? "100%"
                              : "-100%"
                            : "0"
                        })`,
                        opacity: slide.entering ? 0 : 1,
                      }
                    : undefined
                }
              >
                <Image
                  className="h-full w-full object-contain"
                  style={
                    zoom
                      ? {
                          transform: "scale(2.5)",
                          transformOrigin: `${zoom.x}% ${zoom.y}%`,
                          transition:
                            "transform 300ms ease-out, transform-origin 60ms linear",
                        }
                      : { transition: "transform 300ms ease-out" }
                  }
                  fill
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  alt={images[imageIndex]?.altText as string}
                  src={images[imageIndex]?.src as string}
                  priority={true}
                />
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <button
              formAction={() => updateImage(nextImageIndex.toString())}
              aria-label="Next product image"
              className={buttonClassName}
            >
              <ArrowRightIcon className="h-7 w-7" strokeWidth={2} />
            </button>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div
            ref={emblaRef}
            className="my-12 w-full max-w-[550px] overflow-hidden"
          >
            <ul className="flex items-center justify-center gap-2 py-1">
              {images.map((image, index) => {
                const isActive = index === imageIndex;

                return (
                  <li key={image.src} className="h-20 w-20 flex-none">
                    <button
                      formAction={() => updateImage(index.toString())}
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
        ) : null}
      </div>
    </form>
  );
}
