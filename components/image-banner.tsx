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
      className="group relative block h-full w-full overflow-hidden border border-[#111111] dark:border-neutral-800"
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
