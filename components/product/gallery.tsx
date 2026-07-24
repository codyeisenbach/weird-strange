"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
    "flex items-center justify-center p-2 text-ws-charcoal transition-transform ease-in-out active:scale-125";

  return (
    <form>
      <div className="flex w-full flex-col justify-center items-center h-fit">
        <div className="relative aspect-square h-full max-h-[550px] max-w-[550px] w-full overflow-hidden">
          {images[imageIndex] && (
            <Image
              className="h-full w-full object-contain"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              alt={images[imageIndex]?.altText as string}
              src={images[imageIndex]?.src as string}
              priority={true}
            />
          )}
        </div>
        {images.length > 1 ? (
          <div className="flex w-full mx-5 items-center justify-between gap-2 max-w-[550px]">
            <button
              formAction={() => updateImage(previousImageIndex.toString())}
              aria-label="Previous product image"
              className={buttonClassName}
            >
              <ArrowLeftIcon className="h-7 w-7" strokeWidth={2} />
            </button>

            <div
              ref={emblaRef}
              className="my-12 min-w-0 flex-1 overflow-hidden"
            >
              <ul className="flex items-center justify-center gap-2 py-1">
                {images.map((image, index) => {
                  const isActive = index === imageIndex;

                  return (
                    <li key={image.src} className="h-20 w-20 flex-none">
                      <button
                        formAction={() => updateImage(index.toString())}
                        aria-label="Select product image"
                        className="h-full w-full"
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

            <button
              formAction={() => updateImage(nextImageIndex.toString())}
              aria-label="Next product image"
              className={buttonClassName}
            >
              <ArrowRightIcon className="h-7 w-7" strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
