import sanitizeHtml from "sanitize-html";

// Allowlist matched 1:1 to what RichTextEditor's Tiptap config (StarterKit +
// Link) can actually produce — no img/script/style/inline style or class,
// so there's no path for HTML the sanitizer allows but the editor can't
// generate, or vice versa. This is the real XSS boundary: admin-authored
// HTML still passes through here before ever reaching Supabase, since the
// editor UI restricting input client-side isn't a security control on its
// own (same "don't trust the caller" reasoning as requireAdmin()).
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
    allowedSchemes: ["http", "https", "mailto"],
  }).trim();
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
