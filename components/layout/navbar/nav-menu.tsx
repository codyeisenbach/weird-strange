import { Menu } from "lib/shopify/types";
import Link from "next/link";

// While the coming-soon gate is active, only the Archive link makes sense in
// the nav — everything else (Clothing/collections, Prints, etc.) points at
// storefront surfaces that redirect away (middleware.ts). Signed-in admins
// bypass the gate itself, so they still see the full menu.
export function NavMenu({
  menu,
  isAdmin,
  isGated,
}: {
  menu: Menu[];
  isAdmin: boolean;
  isGated: boolean;
}) {
  const items =
    isGated && !isAdmin
      ? menu.filter((item) => item.path.startsWith("/archive"))
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
