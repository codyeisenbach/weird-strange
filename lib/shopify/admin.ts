import { ensureStartsWith } from "lib/utils";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, "https://")
  : "";
const endpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

export async function shopifyAdminFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const token = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!endpoint) {
    throw new Error("SHOPIFY_STORE_DOMAIN environment variable is not set");
  }

  if (!token) {
    throw new Error(
      "SHOPIFY_ADMIN_API_ACCESS_TOKEN environment variable is not set",
    );
  }

  const result = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query,
      ...(variables && { variables }),
    }),
  });

  const body = await result.json();

  if (body.errors) {
    throw new Error(`Shopify Admin API error: ${JSON.stringify(body.errors)}`);
  }

  return body.data as T;
}

const productSetMutation = /* GraphQL */ `
  mutation productSet($input: ProductSetInput!) {
    productSet(synchronous: true, input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type ProductSetOptionValue = { name: string };

export type ProductSetOption = {
  name: string;
  position: number;
  values: ProductSetOptionValue[];
};

export type ProductSetVariant = {
  price: string;
  sku: string;
  optionValues: { optionName: string; name: string }[];
};

export type ProductSetFile = {
  originalSource: string;
  alt?: string;
  contentType: "IMAGE";
};

export type ProductSetInput = {
  title: string;
  descriptionHtml?: string;
  status: "ACTIVE" | "DRAFT";
  tags?: string[];
  handle?: string;
  productOptions?: ProductSetOption[];
  variants?: ProductSetVariant[];
  files?: ProductSetFile[];
};

type ProductSetResponse = {
  productSet: {
    product: { id: string; title: string; handle: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function createShopifyProduct(input: ProductSetInput) {
  const data = await shopifyAdminFetch<ProductSetResponse>({
    query: productSetMutation,
    variables: { input },
  });

  if (data.productSet.userErrors.length > 0) {
    throw new Error(
      `Shopify productSet userErrors: ${JSON.stringify(data.productSet.userErrors)}`,
    );
  }

  return data.productSet.product;
}
