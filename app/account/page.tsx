import {
  customerAccountConfigured,
  getCustomer,
  getCustomerSession,
} from "lib/shopify/customer";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account",
  description: "Your account.",
};

export default async function AccountPage() {
  if (!customerAccountConfigured) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-20 text-ws-charcoal">
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

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-20 text-ws-charcoal">
      <h1 className="mb-4 text-2xl font-bold">Hi, {name}</h1>
      {customer.emailAddress?.emailAddress ? (
        <p className="mb-8">
          Signed in as {customer.emailAddress.emailAddress}
        </p>
      ) : null}
      <a
        href="/api/auth/logout"
        className="inline-block border border-ws-charcoal px-4 py-2 text-sm hover:opacity-70"
      >
        Log out
      </a>
    </div>
  );
}
