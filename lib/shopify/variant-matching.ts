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

// Determines which color a product card should default to: the first color
// (in option order) with an available variant, falling back to the first
// color value at all if none are available. Undefined for products with no
// color option.
export function getDefaultColor(
  product: Pick<Product, "options" | "variants">,
): string | undefined {
  const colorOption = getColorOption(product.options);
  if (!colorOption) return undefined;

  return (
    colorOption.values.find((color) =>
      product.variants.some(
        (variant) => variant.availableForSale && hasColor(variant, color),
      ),
    ) ?? colorOption.values[0]
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

const THUMB2_FILENAME_PATTERN = /_thumb2\b/i;

function isThumb2Image(image: Image) {
  const filename = image.url.split("/").pop()?.split("?")[0] ?? "";
  return THUMB2_FILENAME_PATTERN.test(filename);
}

// True when `image` is the Shopify-designated photo for one of the variants
// matching `color` — a same-image comparison (by id, falling back to url for
// images Shopify didn't assign an id to) against each such variant's own
// `image` field, not a match against merchant-typed alt text. A variant with
// no image of its own inherits the product's featuredImage from the
// Storefront API, so featuredImage is excluded from this comparison to avoid
// crediting every imageless variant with matching it.
function isDesignatedImageForColor(
  product: Pick<Product, "variants" | "featuredImage">,
  image: Image,
  color: string,
): boolean {
  return product.variants.some((variant) => {
    if (!hasColor(variant, color)) return false;
    if (!variant.image) return false;
    if (variant.image.url === product.featuredImage?.url) return false;

    return variant.image.id
      ? variant.image.id === image.id
      : variant.image.url === image.url;
  });
}

// Finds the merchant-designated "_thumb2" image (a filename convention set
// in Shopify admin, same mechanism as the primary thumbnail) to swap to on
// product-card hover. When the product has a color option, only a _thumb2
// image that's some same-color variant's own designated image is used, so
// hovering never flashes a different color's photo; falls back to any
// _thumb2 image otherwise (colorless products, or one shared across colors).
export function getHoverImage(
  product: Pick<Product, "options" | "images" | "variants" | "featuredImage">,
  color: string | undefined,
): Image | undefined {
  const thumb2Images = product.images.filter(isThumb2Image);
  if (!thumb2Images.length) return undefined;

  const colorOption = getColorOption(product.options);
  if (!color || !colorOption) return thumb2Images[0];

  return (
    thumb2Images.find((image) =>
      isDesignatedImageForColor(product, image, color),
    ) ?? thumb2Images[0]
  );
}
