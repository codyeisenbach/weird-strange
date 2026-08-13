import { GoogleTagManager } from "@next/third-parties/google";
import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { SaleBanner } from "components/layout/sale-banner";
import { JsonLd } from "components/seo/json-ld";
import { GeistSans } from "geist/font/sans";
import { getCart } from "lib/shopify";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "lib/structured-data/site";
import { baseUrl } from "lib/utils";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
      </head>
      <body className="bg-ws-cream flex justify-center flex-col w-full text-ws-charcoal selection:bg-teal-300 dark:selection:bg-pink-500 dark:selection:text-white">
        <GoogleTagManager
          gtmId="GTM-P62WNNWZ"
          gtmScriptUrl="https://sgtm.weirdstrange.com/gtm.js"
        />
        <CartProvider cartPromise={cart}>
          <SaleBanner />
          <Navbar />
          <main className="pt-4 flex flex-col max-w-[1280px] justify-center self-center w-full">
            {children}
            <Toaster closeButton />
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
