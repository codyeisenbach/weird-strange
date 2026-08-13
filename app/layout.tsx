import { JsonLd } from "components/seo/json-ld";
import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { SaleBanner } from "components/layout/sale-banner";
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N99WWR99');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className="bg-ws-cream flex justify-center flex-col w-full text-ws-charcoal selection:bg-teal-300 dark:selection:bg-pink-500 dark:selection:text-white">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N99WWR99"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
