"use client";

import clsx from "clsx";
import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function FooterMenuItem({ item }: { item: Menu }) {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname === item.path);

  useEffect(() => {
    setActive(pathname === item.path);
  }, [pathname, item.path]);

  return (
    <li>
      <Link
        href={item.path}
        className={clsx(
          "block p-2 text-lg text-ws-charcoal underline-offset-4 hover:underline md:inline-block md:text-sm",
          {
            "font-medium": active,
          },
        )}
      >
        {item.title}
      </Link>
    </li>
  );
}

export default function FooterMenu({ menu }: { menu: Menu[] }) {
  if (!menu.length) return null;

  return (
    <nav>
      <ul>
        {menu.map((item: Menu) => {
          return <FooterMenuItem key={item.title} item={item} />;
        })}
      </ul>
    </nav>
  );
}
