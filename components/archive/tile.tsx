import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

export function ArchiveTile({
  href,
  src,
  alt,
  title,
  className,
}: {
  href: string;
  src?: string | null;
  alt: string;
  title: string;
  className?: string;
}) {
  return (
    <Link href={href} prefetch={true} className={clsx("group block", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium text-ws-charcoal group-hover:underline">
        {title}
      </h3>
    </Link>
  );
}
