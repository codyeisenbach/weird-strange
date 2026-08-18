import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const shopId = process.env.SHOPIFY_SHOP_ID;

const authBase = `https://shopify.com/authentication/${shopId}`;
const customerApiUrl = `https://shopify.com/${shopId}/account/customer/api/2025-04/graphql`;

export const customerAccountConfigured = Boolean(clientId && shopId);

// Origin as seen by the client — respects proxy headers so the OAuth
// redirect_uri is correct behind tunnels (local dev) and Vercel.
export function requestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export const SESSION_COOKIES = {
  accessToken: "customer_access_token",
  refreshToken: "customer_refresh_token",
  idToken: "customer_id_token",
  expiresAt: "customer_expires_at",
} as const;

export const OAUTH_COOKIES = {
  state: "customer_oauth_state",
  verifier: "customer_oauth_verifier",
} as const;

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64Url(randomBytes(32));
}

export function codeChallenge(verifier: string): string {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export function generateState(): string {
  return base64Url(randomBytes(16));
}

export function buildAuthorizationUrl({
  origin,
  state,
  verifier,
}: {
  origin: string;
  state: string;
  verifier: string;
}): string {
  const url = new URL(`${authBase}/oauth/authorize`);
  url.searchParams.set("scope", "openid email customer-account-api:full");
  url.searchParams.set("client_id", clientId!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  id_token?: string;
};

export async function exchangeCodeForTokens({
  code,
  verifier,
  origin,
}: {
  code: string;
  verifier: string;
  origin: string;
}): Promise<TokenResponse> {
  const res = await fetch(`${authBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId!,
      redirect_uri: `${origin}/api/auth/callback`,
      code,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const res = await fetch(`${authBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId!,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export function buildLogoutUrl({
  idToken,
  origin,
}: {
  idToken: string;
  origin: string;
}): string {
  const url = new URL(`${authBase}/logout`);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", origin);
  return url.toString();
}

export type Customer = {
  firstName: string | null;
  lastName: string | null;
  emailAddress: { emailAddress: string } | null;
};

export type OrderMoney = {
  amount: string;
  currencyCode: string;
};

export type OrderLineItem = {
  title: string;
  quantity: number;
  image: { url: string; altText: string | null } | null;
  price: OrderMoney;
  totalPrice: OrderMoney;
  productId: string | null;
};

export type OrderFulfillment = {
  status: string;
  estimatedDeliveryAt: string | null;
  trackingInformation: {
    number: string | null;
    url: string | null;
    company: string | null;
  }[];
};

export type Order = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  statusPageUrl: string;
  subtotal: OrderMoney | null;
  totalTax: OrderMoney | null;
  totalShipping: OrderMoney | null;
  totalPrice: OrderMoney;
  lineItems: { nodes: OrderLineItem[] };
  fulfillments: { nodes: OrderFulfillment[] };
};

export type OrderConnection = {
  nodes: Order[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

const ORDER_FIELDS = `
  id
  name
  processedAt
  financialStatus
  fulfillmentStatus
  statusPageUrl
  subtotal {
    amount
    currencyCode
  }
  totalTax {
    amount
    currencyCode
  }
  totalShipping {
    amount
    currencyCode
  }
  totalPrice {
    amount
    currencyCode
  }
  lineItems(first: 50) {
    nodes {
      title
      quantity
      image {
        url
        altText
      }
      price {
        amount
        currencyCode
      }
      totalPrice {
        amount
        currencyCode
      }
      variant {
        product {
          id
        }
      }
    }
  }
  fulfillments(first: 10) {
    nodes {
      status
      estimatedDeliveryAt
      trackingInformation {
        number
        url
        company
      }
    }
  }
`;

// The API returns productId nested under variant.product.id; flatten it
// onto the line item so callers don't need to know about that nesting.
function reshapeOrder<T extends { lineItems: { nodes: unknown[] } }>(
  order: T,
): T {
  return {
    ...order,
    lineItems: {
      nodes: order.lineItems.nodes.map((item) => {
        const raw = item as OrderLineItem & {
          variant: { product: { id: string } } | null;
        };
        const { variant, ...rest } = raw;
        return { ...rest, productId: variant?.product.id ?? null };
      }),
    },
  };
}

export type CustomerSession = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  idToken: string | undefined;
  isExpired: boolean;
};

export async function getCustomerSession(): Promise<CustomerSession> {
  const cookieStore = await cookies();
  const expiresAt = cookieStore.get(SESSION_COOKIES.expiresAt)?.value;
  return {
    accessToken: cookieStore.get(SESSION_COOKIES.accessToken)?.value,
    refreshToken: cookieStore.get(SESSION_COOKIES.refreshToken)?.value,
    idToken: cookieStore.get(SESSION_COOKIES.idToken)?.value,
    isExpired: expiresAt ? Date.now() > Number(expiresAt) : true,
  };
}

export async function getCustomer(
  accessToken: string,
): Promise<Customer | null> {
  const res = await fetch(customerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({
      query: `
        query getCustomer {
          customer {
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      `,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = await res.json();
  if (body.errors || !body.data?.customer) return null;

  return body.data.customer;
}

export async function getCustomerOrders(
  accessToken: string,
  {
    first,
    after,
    last,
    before,
  }: { first?: number; after?: string; last?: number; before?: string } = {},
): Promise<OrderConnection | null> {
  // Shopify's connection model requires forward (first/after) and backward
  // (last/before) pagination args to be mutually exclusive.
  const variables = before
    ? { last: last ?? 10, before }
    : { first: first ?? 10, after };

  const res = await fetch(customerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({
      query: `
        query getCustomerOrders($first: Int, $after: String, $last: Int, $before: String) {
          customer {
            orders(first: $first, after: $after, last: $last, before: $before, sortKey: PROCESSED_AT, reverse: true) {
              nodes {
                ${ORDER_FIELDS}
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        }
      `,
      variables,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = await res.json();
  if (body.errors || !body.data?.customer) return null;

  const orders = body.data.customer.orders;
  return {
    ...orders,
    nodes: orders.nodes.map(reshapeOrder),
  };
}

export async function getCustomerOrder(
  accessToken: string,
  orderId: string,
): Promise<Order | null> {
  const res = await fetch(customerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({
      query: `
        query getCustomerOrder($id: ID!) {
          order(id: $id) {
            ${ORDER_FIELDS}
          }
        }
      `,
      variables: { id: orderId },
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = await res.json();
  if (body.errors || !body.data?.order) return null;

  return reshapeOrder(body.data.order);
}
