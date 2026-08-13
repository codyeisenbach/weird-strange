import type { Metadata } from "next";

import Prose from "components/prose";
import { JsonLd } from "components/seo/json-ld";
import { getPage } from "lib/shopify";
import { buildBreadcrumbJsonLd } from "lib/shopify/structured-data";
import { siteUrl } from "lib/site-config";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
}

export default async function Page(props: {
  params: Promise<{ page: string }>;
}) {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: page.title, url: `${siteUrl}/${page.handle}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}
