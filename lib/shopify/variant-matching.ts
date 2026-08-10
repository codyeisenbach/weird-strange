import { Product, ProductOption } from "./types";

// Images are tagged for a color by including that color name (as a whole
// word) in their alt text, e.g. "Black - front". Images whose alt text
// doesn't mention any color option are treated as shared across colors.
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
  return colorOption?.values.some((color) => matchesColor(altText, color)) ?? false;
}

// Determines which color (if any) a product image represents, based on its
// alt text, so that a product card showing that image can deep-link to the
// PDP with the matching color preselected.
export function getColorFromAltText(
  product: Pick<Product, "options">,
  altText: string | undefined,
): string | undefined {
  if (!altText) return undefined;

  const colorOption = getColorOption(product.options);
  if (!colorOption) return undefined;

  return colorOption.values.find((color) => matchesColor(altText, color));
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

  const matchingVariant = product.variants.find((variant) =>
    variant.selectedOptions.some(
      (option) =>
        option.name.toLowerCase() === "color" && option.value === color,
    ),
  );

  const params = new URLSearchParams();
  params.set(colorOption.name.toLowerCase(), color);

  matchingVariant?.selectedOptions.forEach(({ name, value }) => {
    if (name.toLowerCase() !== "color") {
      params.set(name.toLowerCase(), value);
    }
  });

  return params.toString();
}
