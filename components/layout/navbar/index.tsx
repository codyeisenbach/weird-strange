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
    <nav className="relative flex items-center justify-center p-4 lg:px-6 border-b border-[#111111] text-ws-charcoal">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex w-full items-center justify-between max-w-[1280px] px-8">
        <div className="flex w-full md:w-1/3">
          <Link
            href="/"
            prefetch={true}
            className="flex w-full items-center justify-center md:w-auto"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain mr-8"
                priority
              />
            ) : null}
          </Link>
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
        <div className="hidden justify-center md:flex md:w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex items-center justify-end gap-2 md:w-1/3">
          <Link
            href="/account"
            prefetch={false}
            aria-label="Account"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-ws-charcoal transition-colors dark:border-neutral-700"
          >
            <UserIcon className="h-4 transition-all ease-in-out hover:scale-110" />
          </Link>
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
