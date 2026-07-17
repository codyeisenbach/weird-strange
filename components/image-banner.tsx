import Image from "next/image";
import Link from "next/link";

export function ImageBanner({
  src,
  href,
  alt = "",
}: {
  src: string;
  href: string;
  alt?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[3/1] w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover transition duration-300 ease-in-out group-hover:scale-105"
      />
    </Link>
  );
}
