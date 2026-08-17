import Image from "next/image";
import Link from "next/link";

import FooterMenu from "components/layout/footer-menu";
import { getMenu } from "lib/shopify";
import { Suspense } from "react";

const { COMPANY_NAME, SITE_NAME } = process.env;
const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2026 + (currentYear > 2026 ? `-${currentYear}` : "");
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700";
  const menu = await getMenu("footer");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <footer className="text-sm text-ws-charcoal">
      <div className="border-t border-neutral-200 dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 text-sm md:flex-row md:gap-12 md:px-4 min-[1320px]:px-0">
          <div>
            <Link
              className="flex items-center gap-2 text-ws-charcoal md:pt-1"
              href="/"
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={100}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              ) : null}
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="flex h-[188px] w-[200px] flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
        </div>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-1 py-6 text-sm md:flex-row md:gap-0 md:px-4 min-[1320px]:px-0">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".")
              ? "."
              : ""}{" "}
            All rights reserved.
          </p>
          <p className="md:ml-auto">
            <a
              href="https://weirdstrange.com/archive"
              className="text-ws-charcoal"
            >
              Weird Strange Archive
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
