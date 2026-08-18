import {
  customerAccountConfigured,
  getCustomer,
  getCustomerOrder,
  getCustomerOrders,
  getCustomerSession,
  type Order,
  type OrderFulfillment,
  type OrderLineItem,
} from "lib/shopify/customer";
import Price from "components/price";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account",
  description: "Your account.",
};

const ORDERS_PER_PAGE = 10;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!customerAccountConfigured) {
    return (
      <div className="mx-auto max-w-screen-sm px-1 py-20 text-ws-charcoal md:px-4">
        <h1 className="mb-4 text-2xl font-bold">Account</h1>
        <p>
          Customer accounts are not configured yet. Set SHOPIFY_SHOP_ID and
          SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID.
        </p>
      </div>
    );
  }

  const session = await getCustomerSession();

  if (!session.accessToken) {
    if (session.refreshToken) {
      redirect("/api/auth/refresh?next=/account");
    }
    redirect("/api/auth/login");
  }

  const customer = await getCustomer(session.accessToken);

  if (!customer) {
    if (session.refreshToken) {
      redirect("/api/auth/refresh?next=/account");
    }
    redirect("/api/auth/login");
  }

  const name =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "there";

  const params = await searchParams;
  const orderId = typeof params.order === "string" ? params.order : undefined;

  return (
    <div className="mx-auto max-w-screen-lg px-1 py-20 text-ws-charcoal md:px-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Hi, {name}</h1>
          {customer.emailAddress?.emailAddress ? (
            <p className="text-sm text-ws-text-muted">
              Signed in as {customer.emailAddress.emailAddress}
            </p>
          ) : null}
        </div>
        <a
          href="/api/auth/logout"
          className="inline-block shrink-0 border border-ws-border px-4 py-2 text-sm hover:opacity-70"
        >
          Log out
        </a>
      </div>

      {orderId ? (
        <OrderDetail accessToken={session.accessToken} orderId={orderId} />
      ) : (
        <OrderHistory accessToken={session.accessToken} params={params} />
      )}
    </div>
  );
}

async function OrderHistory({
  accessToken,
  params,
}: {
  accessToken: string;
  params: { [key: string]: string | string[] | undefined };
}) {
  const after = typeof params.after === "string" ? params.after : undefined;
  const before = typeof params.before === "string" ? params.before : undefined;

  const orders = await getCustomerOrders(accessToken, {
    first: before ? undefined : ORDERS_PER_PAGE,
    after,
    last: before ? ORDERS_PER_PAGE : undefined,
    before,
  });

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Order History</h2>

      {!orders || orders.nodes.length === 0 ? (
        <p className="text-sm text-ws-text-muted">
          {before ? "No more orders." : "You haven't placed any orders yet."}
        </p>
      ) : (
        <>
          <ul className="border-t border-ws-border/20">
            {orders.nodes.map((order) => (
              <li key={order.id} className="border-b border-ws-border/20">
                <Link
                  href={`/account?order=${encodeURIComponent(order.id)}`}
                  className="flex flex-col gap-2 py-4 hover:bg-ws-charcoal/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
                >
                  <div className="flex items-center gap-4">
                    <OrderThumbnail lineItems={order.lineItems.nodes} />
                    <div>
                      <p className="font-medium">{order.name}</p>
                      <p className="text-sm text-ws-text-muted">
                        {formatDate(order.processedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                    <StatusBadge status={getDisplayStatus(order)} />
                    <Price
                      className="text-sm font-medium"
                      amount={order.totalPrice.amount}
                      currencyCode={order.totalPrice.currencyCode}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            {orders.pageInfo.hasPreviousPage && orders.pageInfo.startCursor ? (
              <Link
                href={`/account?before=${encodeURIComponent(orders.pageInfo.startCursor)}`}
                className="border border-ws-border px-4 py-2 text-sm hover:opacity-70"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {orders.pageInfo.hasNextPage && orders.pageInfo.endCursor ? (
              <Link
                href={`/account?after=${encodeURIComponent(orders.pageInfo.endCursor)}`}
                className="border border-ws-border px-4 py-2 text-sm hover:opacity-70"
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </section>
  );
}

async function OrderDetail({
  accessToken,
  orderId,
}: {
  accessToken: string;
  orderId: string;
}) {
  const order = await getCustomerOrder(accessToken, orderId);

  if (!order) {
    return (
      <section>
        <Link
          href="/account"
          className="mb-4 inline-block text-sm text-ws-text-muted hover:text-ws-charcoal"
        >
          &larr; Back to orders
        </Link>
        <p className="text-sm text-ws-text-muted">
          We couldn&apos;t find that order.
        </p>
      </section>
    );
  }

  return (
    <section>
      <Link
        href="/account"
        className="mb-6 inline-block text-sm text-ws-text-muted hover:text-ws-charcoal"
      >
        &larr; Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{order.name}</h2>
          <p className="text-sm text-ws-text-muted">
            Placed on {formatDate(order.processedAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={getDisplayStatus(order)} />
          <a
            href={order.statusPageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-ws-text-muted underline hover:text-ws-charcoal"
          >
            View order status
          </a>
        </div>
      </div>

      <TrackingInfo fulfillments={order.fulfillments.nodes} />

      <ul className="border-t border-ws-border/20">
        {order.lineItems.nodes.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-4 border-b border-ws-border/20 py-4"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-ws-border/20 bg-ws-cream">
              {item.image ? (
                <Image
                  className="h-full w-full object-cover"
                  width={64}
                  height={64}
                  alt={item.image.altText || item.title}
                  src={item.image.url}
                />
              ) : null}
            </div>
            <div className="flex flex-1 items-center justify-between gap-4">
              <div>
                <p>{item.title}</p>
                <p className="text-sm text-ws-text-muted">
                  Qty {item.quantity}
                </p>
              </div>
              <Price
                className="text-right text-sm font-medium"
                amount={item.totalPrice.amount}
                currencyCode={item.totalPrice.currencyCode}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 max-w-xs space-y-2 py-4 text-sm sm:ml-auto">
        {order.subtotal ? (
          <div className="flex items-center justify-between border-b border-ws-border/20 pb-1">
            <p>Subtotal</p>
            <Price
              amount={order.subtotal.amount}
              currencyCode={order.subtotal.currencyCode}
            />
          </div>
        ) : null}
        {order.totalShipping ? (
          <div className="flex items-center justify-between border-b border-ws-border/20 pb-1">
            <p>Shipping</p>
            <Price
              amount={order.totalShipping.amount}
              currencyCode={order.totalShipping.currencyCode}
            />
          </div>
        ) : null}
        {order.totalTax ? (
          <div className="flex items-center justify-between border-b border-ws-border/20 pb-1">
            <p>Tax</p>
            <Price
              amount={order.totalTax.amount}
              currencyCode={order.totalTax.currencyCode}
            />
          </div>
        ) : null}
        <div className="flex items-center justify-between border-b border-ws-border/20 pb-1 font-medium">
          <p>Total</p>
          <Price
            amount={order.totalPrice.amount}
            currencyCode={order.totalPrice.currencyCode}
          />
        </div>
      </div>
    </section>
  );
}

function OrderThumbnail({ lineItems }: { lineItems: OrderLineItem[] }) {
  const image = lineItems.find((item) => item.image)?.image;

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-ws-border/20 bg-ws-cream">
      {image ? (
        <Image
          className="h-full w-full object-cover"
          width={56}
          height={56}
          alt={image.altText || ""}
          src={image.url}
        />
      ) : null}
    </div>
  );
}

// Shopify's fulfillmentStatus stays "FULFILLED" even after a shipment is
// delivered — a fulfillment's own status (SUCCESS = shipped, with tracking)
// is the more specific signal, so prefer it when present.
function getDisplayStatus(order: Order): string | null {
  const hasShipped = order.fulfillments.nodes.some(
    (f) => f.status === "SUCCESS",
  );
  if (hasShipped) return "SHIPPED";
  return order.fulfillmentStatus ?? order.financialStatus;
}

function TrackingInfo({ fulfillments }: { fulfillments: OrderFulfillment[] }) {
  const tracking = fulfillments.flatMap((f) => f.trackingInformation);
  if (tracking.length === 0) return null;

  return (
    <div className="mb-6 space-y-1 border border-ws-border/20 p-4 text-sm">
      {tracking.map((t, i) => (
        <p key={i}>
          {t.company ? `${t.company}: ` : "Tracking: "}
          {t.url ? (
            <a
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-ws-charcoal"
            >
              {t.number ?? "Track package"}
            </a>
          ) : (
            (t.number ?? "—")
          )}
        </p>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  return (
    <span className="inline-block whitespace-nowrap border border-ws-border/40 px-2 py-1 text-xs uppercase tracking-wide text-ws-text-muted">
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
