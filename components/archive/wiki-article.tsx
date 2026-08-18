import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { htmlToPlainText } from "lib/archive/sanitize";

export type InfoboxFact = {
  label: string;
  value: ReactNode;
};

// `text` is HTML, sanitized at write time (see lib/archive/sanitize.ts) —
// rendering it here trusts the DB as the sanitization boundary, not the
// browser. htmlToPlainText is only used to check whether there's any real
// content (an editor can produce "<p></p>" for an empty doc, which isn't
// an empty string but also isn't real article text).
export function ArticleBody({ text }: { text: string | null }) {
  const hasContent = text ? htmlToPlainText(text).length > 0 : false;

  return hasContent ? (
    <div
      className="space-y-4 text-[17px] leading-7 [&_a]:text-blue-700 [&_a]:hover:underline [&_a]:dark:text-blue-400 [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-normal [&_h3]:mt-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-normal [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: text as string }}
    />
  ) : (
    <p className="font-sans text-sm text-neutral-500 italic">
      No article text yet.
    </p>
  );
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
      <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-2 text-center font-serif text-base font-semibold text-ws-charcoal dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50">
        {title}
      </div>
      {src ? (
        <div className="w-full border-b border-neutral-300 dark:border-neutral-700">
          <Image
            src={src}
            alt={alt}
            width={288}
            height={288}
            sizes="288px"
            className="h-auto w-full"
          />
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
                <th className="w-24 px-3 py-2 text-left font-medium text-neutral-500 dark:text-neutral-300">
                  {fact.label}
                </th>
                <td className="px-3 py-2 text-ws-charcoal dark:text-neutral-50">
                  {fact.value}
                </td>
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
  title: ReactNode;
  subtitle?: string;
  infobox: ReactNode;
  body: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-(--breakpoint-lg) px-4 py-12 font-serif text-ws-charcoal">
      <h1 className="text-4xl leading-tight font-normal">{title}</h1>
      {subtitle ? (
        <p className="mt-1 font-sans text-sm text-neutral-500">{subtitle}</p>
      ) : null}
      <hr className="mt-2 mb-6 border-neutral-300 dark:border-neutral-700" />

      {infobox}

      {body}

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
    <Link
      href={href}
      className="text-blue-700 hover:underline dark:text-blue-400"
    >
      {children}
    </Link>
  );
}
