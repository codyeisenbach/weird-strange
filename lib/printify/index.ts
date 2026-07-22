import { PrintifyProduct } from "./types";

const endpoint = "https://api.printify.com/v1";

export async function getPrintifyProduct(
  shopId: string | number,
  productId: string,
): Promise<PrintifyProduct> {
  const token = process.env.WEIRD_STRANGE_PRINTIFY_TOKEN;

  if (!token) {
    throw new Error(
      "WEIRD_STRANGE_PRINTIFY_TOKEN environment variable is not set",
    );
  }

  const res = await fetch(
    `${endpoint}/shops/${shopId}/products/${productId}.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json;charset=utf-8",
        "User-Agent": "weird-strange-storefront",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      `Printify product fetch failed: ${res.status} ${await res.text()}`,
    );
  }

  return res.json();
}
