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

// Determines which color a product card should default to: the color of
// whichever variant is assigned the product's featuredImage (Shopify's own
// "this is the photo to lead with" signal — set by the merchant reordering
// images in admin), so the card agrees with what they actually featured
// instead of an option-list ordering they may not have curated at all.
// Falls back to the first color with an available variant — then the first
// color value outright — for the rare case featuredImage matches no
// variant (e.g. it's a lifestyle shot not assigned to any variant).
// Undefined for products with no color option.
export function getDefaultColor(
  product: Pick<Product, "options" | "variants" | "featuredImage">,
): string | undefined {
  const colorOption = getColorOption(product.options);
  if (!colorOption) return undefined;

  const featuredColor = colorOption.values.find((color) => {
    const variant = getVariantForColor(product, color);
    return variant?.image?.id && variant.image.id === product.featuredImage?.id;
  });

  return (
    featuredColor ??
    colorOption.values.find((color) =>
      product.variants.some(
        (variant) => variant.availableForSale && hasColor(variant, color),
      ),
    ) ??
    colorOption.values[0]
  );
}

// The image representing a given color: that color's representative
// variant's own `image`, falling back to the product's featuredImage for
// variants with no image of their own (e.g. products with no per-variant
// photos set in Shopify admin).
export function getColorImage(
  product: Pick<Product, "variants" | "featuredImage">,
  color: string | undefined,
): Image | undefined {
  if (!color) return product.featuredImage;

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

// Hover-image filename convention: "<anything>_<color>_hover.<ext>", e.g.
// "tiger-tee_black_hover.jpg". Written with `~` as the delimiter when
// renaming in Shopify admin (tiger-tee~black~hover.jpg) — Shopify silently
// converts `~` to `_` in filenames, so `_` is what actually reaches the
// Storefront API and is what this pattern matches on. `color` is matched
// case-insensitively against the product's Color option values (so color
// names must not themselves contain underscores, e.g. use "offwhite" not
// "off_white", or the segment split below won't isolate it correctly).
// The role is always literally "hover" — a product can have several extra
// photos per color (multiple back/detail angles from Printify), and this
// tag doesn't mean "this is a back shot," it means "this is specifically
// the one to swap to on hover" — so at most one image per color should
// carry it; any other extra photos for that color are simply left
// untagged. This is a merchant-typed convention (same category as the old
// alt-text/`_thumb2` approach it replaces) — the Storefront API has no
// field for "this photo is variant X's hover shot," see
// getVariantForColor()'s doc comment — but unlike alt text or image order,
// it's unambiguous: the color is read directly off the one image in
// question, not inferred from surrounding images or free text a human
// might phrase inconsistently.
const HOVER_FILENAME_PATTERN = /_([^_]+)_hover(?:\.[^.]+)?$/i;

function parseHoverColor(image: Image): string | undefined {
  const filename = image.url.split("/").pop()?.split("?")[0] ?? "";
  return filename.match(HOVER_FILENAME_PATTERN)?.[1];
}

function matchesParsedColor(parsedColor: string, color: string) {
  return parsedColor.toLowerCase() === color.toLowerCase();
}

// Finds the image tagged as the hover-swap shot (see filename convention
// above) for the given color. Returns undefined — no swap, rather than
// risking another color's photo — when the product has a color option but
// no image is tagged as this color's hover shot.
export function getHoverImage(
  product: Pick<Product, "options" | "images">,
  color: string | undefined,
): Image | undefined {
  const hoverImages = product.images
    .map((image) => ({ image, color: parseHoverColor(image) }))
    .filter(
      (entry): entry is { image: Image; color: string } =>
        entry.color !== undefined,
    );
  if (!hoverImages.length) return undefined;

  const colorOption = getColorOption(product.options);
  if (!color || !colorOption) return hoverImages[0]?.image;

  return hoverImages.find((entry) => matchesParsedColor(entry.color, color))
    ?.image;
}
