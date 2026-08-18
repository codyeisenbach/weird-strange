import { Image, Product, ProductOption, ProductVariant } from "./types";

// Images are tagged for a color by including that color name (as a whole
// word) in their alt text, e.g. "Black - front". Images whose alt text
// doesn't mention any color option are treated as shared across colors.
//
// This is only used for the PDP gallery's multi-image filter (see
// app/product/[handle]/page.tsx). The Storefront API has no structural way
// to associate more than one photo with a variant/color (Product.images is a
// flat, unlabeled list, and ProductVariant only exposes a single `image`,
// unlike the Admin API's ProductVariant.media) — so partitioning a full set
// of lifestyle/detail shots by color has no alt-text-free alternative here.
// For picking a *single* representative image per color (product cards,
// hover image), prefer getVariantForColor()'s `image` field instead, which
// is a first-class Shopify relationship, not a merchant-typed convention.
export function matchesColor(altText: string, color: string) {
  return new RegExp(`\\b${color}\\b`, "i").test(altText);
}

export function getColorOption(
  options: ProductOption[],
): ProductOption | undefined {
  return options.find((option) => option.name.toLowerCase() === "color");
}

export function isColorTagged(
  altText: string,
  colorOption: ProductOption | undefined,
) {
  return (
    colorOption?.values.some((color) => matchesColor(altText, color)) ?? false
  );
}

function hasColor(
  variant: Pick<ProductVariant, "selectedOptions">,
  color: string,
) {
  return variant.selectedOptions.some(
    (option) => option.name.toLowerCase() === "color" && option.value === color,
  );
}

// Finds the representative variant for a given color: the first available
// one (falling back to the first at all), so a product card can read its
// `image`/`selectedOptions` directly instead of reverse-engineering color
// from an image's alt text.
export function getVariantForColor(
  product: Pick<Product, "variants">,
  color: string,
): ProductVariant | undefined {
  const variantsForColor = product.variants.filter((variant) =>
    hasColor(variant, color),
  );
  return (
    variantsForColor.find((variant) => variant.availableForSale) ??
    variantsForColor[0]
  );
}

// Determines which color a product card should default to. Prefers the
// color tagged on the product's featuredImage's own filename (see the image
// role convention below) — the merchant may feature a "back" or "detail"
// shot rather than the variant-assigned "front" one, so featuredImage and
// the color's variant `image` can legitimately be two different photos of
// the same color; reading the tag off featuredImage directly (rather than
// asking "which variant is featuredImage assigned to," which only answers
// correctly when the merchant featured the exact photo already on a
// variant) is what makes the two agree on color even when they disagree on
// which specific photo. Falls back to whichever variant featuredImage IS
// assigned to (for products predating this tagging convention), then the
// first color with an available variant, then the first color value
// outright. Undefined for products with no color option.
export function getDefaultColor(
  product: Pick<Product, "options" | "variants" | "featuredImage">,
): string | undefined {
  const colorOption = getColorOption(product.options);
  if (!colorOption) return undefined;

  const taggedColor = product.featuredImage
    ? parseImageRole(product.featuredImage)?.color
    : undefined;
  const featuredTagColor = taggedColor
    ? colorOption.values.find((color) => matchesParsedColor(taggedColor, color))
    : undefined;

  const featuredVariantColor = colorOption.values.find((color) => {
    const variant = getVariantForColor(product, color);
    return variant?.image?.id && variant.image.id === product.featuredImage?.id;
  });

  return (
    featuredTagColor ??
    featuredVariantColor ??
    colorOption.values.find((color) =>
      product.variants.some(
        (variant) => variant.availableForSale && hasColor(variant, color),
      ),
    ) ??
    colorOption.values[0]
  );
}

// The image representing a given color, for a product card. When the color
// is the one featuredImage is tagged/assigned for, featuredImage itself is
// used directly — preserving exactly the photo the merchant featured
// (which may be a "back"/"detail" shot, not necessarily that color's
// variant-assigned "front" image). Otherwise (a color other than
// featuredImage's) falls back to that color's own variant image, then
// featuredImage as a last resort.
export function getColorImage(
  product: Pick<Product, "variants" | "featuredImage">,
  color: string | undefined,
): Image | undefined {
  if (!color) return product.featuredImage;

  const featuredTagColor = product.featuredImage
    ? parseImageRole(product.featuredImage)?.color
    : undefined;
  if (featuredTagColor && matchesParsedColor(featuredTagColor, color)) {
    return product.featuredImage;
  }

  const variant = getVariantForColor(product, color);
  return variant?.image ?? product.featuredImage;
}

// Builds the query string that preselects the given color (and the cheapest
// available variant's other options for that color, e.g. size) so a product
// card's link lands on the PDP with the shown variant already selected.
export function getVariantSearchParams(
  product: Pick<Product, "options" | "variants">,
  color: string | undefined,
): string {
  if (!color) return "";

  const colorOption = getColorOption(product.options);
  if (!colorOption) return "";

  const matchingVariant = getVariantForColor(product, color);

  const params = new URLSearchParams();
  params.set(colorOption.name.toLowerCase(), color);

  matchingVariant?.selectedOptions.forEach(({ name, value }) => {
    if (name.toLowerCase() !== "color") {
      params.set(name.toLowerCase(), value);
    }
  });

  return params.toString();
}

// Image role filename convention: "<anything>_<color>_<role>.<ext>", e.g.
// "tiger-tee_black_hover.jpg". Written with `~` as the delimiter when
// renaming in Shopify admin (tiger-tee~black~hover.jpg) — Shopify silently
// converts `~` to `_` in filenames, so `_` is what actually reaches the
// Storefront API and is what this pattern matches on. `color` is matched
// case-insensitively against the product's Color option values; hyphens
// are fine within it ("off-white"), but not underscores, since `_` is the
// segment delimiter. `role` is one of IMAGE_ROLES below. Only "hover"
// drives any behavior today — a product can have several extra photos per
// color (multiple angles from Printify), and "hover" doesn't mean "this is
// a back shot," it means "this is specifically the one to swap to on
// hover" — so at most one image per color should carry it. The other roles
// (front/back/front-detail/back-detail) are recorded for the merchant's
// own organization and aren't read by any code yet. This is a
// merchant-typed convention (same category as the old alt-text/`_thumb2`
// approach it replaces) — the Storefront API has no field for "this photo
// is variant X's hover shot," see getVariantForColor()'s doc comment — but
// unlike alt text or image order, it's unambiguous: the color and role are
// read directly off the one image in question, not inferred from
// surrounding images or free text a human might phrase inconsistently.
const IMAGE_ROLES = [
  "front",
  "back",
  "front-detail",
  "back-detail",
  "hover",
] as const;

const IMAGE_ROLE_FILENAME_PATTERN = new RegExp(
  `_([^_]+)_(${IMAGE_ROLES.join("|")})(?:\\.[^.]+)?$`,
  "i",
);

function parseImageRole(
  image: Image,
): { color: string; role: (typeof IMAGE_ROLES)[number] } | undefined {
  const filename = image.url.split("/").pop()?.split("?")[0] ?? "";
  const match = filename.match(IMAGE_ROLE_FILENAME_PATTERN);
  if (!match) return undefined;

  return {
    color: match[1]!,
    role: match[2]!.toLowerCase() as (typeof IMAGE_ROLES)[number],
  };
}

function matchesParsedColor(parsedColor: string, color: string) {
  return parsedColor.toLowerCase() === color.toLowerCase();
}

// Finds the image tagged with the "hover" role (see filename convention
// above) for the given color. Returns undefined — no swap, rather than
// risking another color's photo — when the product has a color option but
// no image is tagged as this color's hover shot.
export function getHoverImage(
  product: Pick<Product, "options" | "images">,
  color: string | undefined,
): Image | undefined {
  const hoverImages = product.images
    .map((image) => ({ image, parsed: parseImageRole(image) }))
    .filter(
      (
        entry,
      ): entry is {
        image: Image;
        parsed: { color: string; role: "hover" };
      } => entry.parsed?.role === "hover",
    );
  if (!hoverImages.length) return undefined;

  const colorOption = getColorOption(product.options);
  if (!color || !colorOption) return hoverImages[0]?.image;

  return hoverImages.find((entry) =>
    matchesParsedColor(entry.parsed.color, color),
  )?.image;
}
