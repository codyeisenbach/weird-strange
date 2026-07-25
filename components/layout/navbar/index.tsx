import { UserIcon } from "@heroicons/react/24/outline";
import CartModal from "components/cart/modal";
import { getMenu } from "lib/shopify";
import { Menu } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import Search, { SearchSkeleton } from "./search";

const logoUrl =
  process.env.NEXT_PUBLIC_LOGO_URL ??
  "https://cdn.shopify.com/s/files/1/0993/4713/6831/files/WEird_Strange_Logo_black.png?v=1784229972";

export async function Navbar() {
  const menu = await getMenu("main-menu");

  return (
    <nav className="sticky top-0 z-40 flex items-center w-full justify-center bg-ws-cream p-2 border-b border-ws-border text-ws-charcoal">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex w-full items-center justify-between max-w-[1280px] px-4 md:px-8">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:static md:left-auto md:top-auto md:w-fit md:translate-x-0 md:translate-y-0">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center justify-center md:w-auto"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain md:mr-8"
                priority
              />
            ) : null}
          </Link>
        </div>
        <div className="flex w-fit items-center justify-center">
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="text-ws-charcoal underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="ml-auto flex items-center justify-end md:ml-0 md:w-fit">
          <div className="hidden justify-center md:flex">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>
          <Link
            href="/account"
            prefetch={false}
            aria-label="Account"
            className="flex h-11 w-11 items-center justify-center text-ws-charcoal transition-colors"
          >
            <UserIcon className="h-5 w-5 transition-transform ease-in-out active:scale-125" />
          </Link>
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
