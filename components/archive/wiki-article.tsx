import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export type InfoboxFact = {
  label: string;
  value: ReactNode;
};

function paragraphsFromPlainText(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function WikiInfobox({
  title,
  src,
  alt,
  facts,
}: {
  title: string;
  src?: string | null;
  alt: string;
  facts: InfoboxFact[];
}) {
  return (
    <aside className="w-full shrink-0 border border-neutral-300 bg-neutral-50 text-sm sm:float-right sm:ml-6 sm:w-72 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-2 text-center font-serif text-base font-semibold text-ws-charcoal dark:border-neutral-700 dark:bg-neutral-800">
        {title}
      </div>
      {src ? (
        <div className="relative aspect-square w-full border-b border-neutral-300 dark:border-neutral-700">
          <Image src={src} alt={alt} fill sizes="288px" className="object-cover" />
        </div>
      ) : null}
      {facts.length > 0 ? (
        <table className="w-full border-collapse">
          <tbody>
            {facts.map((fact) => (
              <tr
                key={fact.label}
                className="border-b border-neutral-200 align-top last:border-0 dark:border-neutral-800"
              >
                <th className="w-24 px-3 py-2 text-left font-medium text-neutral-500">
                  {fact.label}
                </th>
                <td className="px-3 py-2 text-ws-charcoal">{fact.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </aside>
  );
}

export function WikiArticle({
  title,
  subtitle,
  infobox,
  body,
  children,
}: {
  title: string;
  subtitle?: string;
  infobox: ReactNode;
  body: string | null;
  children?: ReactNode;
}) {
  const paragraphs = body ? paragraphsFromPlainText(body) : [];

  return (
    <article className="mx-auto max-w-(--breakpoint-lg) px-4 py-12 font-serif text-ws-charcoal">
      <h1 className="text-4xl leading-tight font-normal">{title}</h1>
      {subtitle ? (
        <p className="mt-1 font-sans text-sm text-neutral-500">{subtitle}</p>
      ) : null}
      <hr className="mt-2 mb-6 border-neutral-300 dark:border-neutral-700" />

      {infobox}

      {paragraphs.length > 0 ? (
        <div className="space-y-4 text-[17px] leading-7">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="font-sans text-sm text-neutral-500 italic">
          No article text yet.
        </p>
      )}

      <div className="clear-both font-sans">{children}</div>
    </article>
  );
}

export function WikiSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="border-b border-neutral-300 font-serif text-2xl font-normal text-ws-charcoal dark:border-neutral-700">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function WikiLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-blue-700 hover:underline dark:text-blue-400">
      {children}
    </Link>
  );
}
