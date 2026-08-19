"use client";

import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

// On the homepage, hide any menu item that links into /collections — the
// store is coming-soon gated there, so linking to it would dead-end. Signed-in
// admins can already reach /collections directly (they bypass the gate in
// middleware.ts), so don't hide the link for them.
export function NavMenu({
  menu,
  isAdmin,
}: {
  menu: Menu[];
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const items =
    pathname === "/" && !isAdmin
      ? menu.filter((item) => !item.path.startsWith("/collections"))
      : menu;

  if (!items.length) return null;

  return (
    <ul className="hidden gap-6 text-sm md:flex md:items-center">
      {items.map((item) => (
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
  );
}
