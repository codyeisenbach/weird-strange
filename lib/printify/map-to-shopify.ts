import { ProductSetInput } from "lib/shopify/admin";
import { PrintifyProduct } from "./types";

export function mapPrintifyProductToShopifyInput(
  product: PrintifyProduct,
): ProductSetInput {
  const enabledVariants = product.variants.filter((v) => v.is_enabled);

  const optionValueTitleById = new Map<
    number,
    { option: string; value: string }
  >();
  for (const option of product.options) {
    for (const value of option.values) {
      optionValueTitleById.set(value.id, {
        option: option.name,
        value: value.title,
      });
    }
  }

  return {
    title: product.title,
    descriptionHtml: product.description ?? "",
    status: product.visible ? "ACTIVE" : "DRAFT",
    tags: product.tags,
    productOptions: product.options.map((option, position) => ({
      name: option.name,
      position,
      values: option.values.map((value) => ({ name: value.title })),
    })),
    variants: enabledVariants.map((variant) => ({
      price: (variant.price / 100).toFixed(2),
      sku: variant.sku,
      optionValues: variant.options
        .map((optionId) => optionValueTitleById.get(optionId))
        .filter((v): v is { option: string; value: string } => Boolean(v))
        .map((v) => ({ optionName: v.option, name: v.value })),
    })),
    files: product.images
      .filter((image) => image.is_default)
      .map((image) => ({
        originalSource: image.src,
        alt: product.title,
        contentType: "IMAGE" as const,
      })),
  };
}
