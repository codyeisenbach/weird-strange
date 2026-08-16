import { siteName, siteUrl } from "lib/site-config";
import { getResendClient } from "lib/email/resend";

type AbandonedCheckoutLineItem = {
  title: string;
  price: string;
  quantity: number;
};

export type AbandonedCheckout = {
  id: string;
  email: string;
  checkout_url: string;
  total_price: string | null;
  currency: string | null;
  line_items: AbandonedCheckoutLineItem[] | null;
};

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(parseFloat(amount));
}

function buildHtml(checkout: AbandonedCheckout) {
  const currency = checkout.currency ?? "USD";
  const lineItemsHtml = (checkout.line_items ?? [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${item.title} &times; ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">${formatMoney(item.price, currency)}</td>
        </tr>`,
    )
    .join("");

  const totalHtml = checkout.total_price
    ? `<tr><td style="padding:8px 0;font-weight:600;">Total</td><td style="padding:8px 0;text-align:right;font-weight:600;">${formatMoney(checkout.total_price, currency)}</td></tr>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#222;">
      <h1 style="font-size:20px;">You left something behind</h1>
      <p>Your cart from ${siteName} is still waiting for you.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${lineItemsHtml}
        ${totalHtml}
      </table>
      <p>
        <a href="${checkout.checkout_url}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;">
          Complete your order
        </a>
      </p>
      <p style="margin-top:32px;font-size:12px;color:#888;">
        You're receiving this because you started checkout on ${siteName} (${siteUrl}).
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888;">Unsubscribe</a>
      </p>
    </div>
  `;
}

export async function sendAbandonedCheckoutEmail(checkout: AbandonedCheckout) {
  const from = process.env.ABANDONED_CHECKOUT_FROM_EMAIL;

  if (!from) {
    throw new Error(
      "ABANDONED_CHECKOUT_FROM_EMAIL must be set to send abandoned checkout emails.",
    );
  }

  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from,
    to: checkout.email,
    subject: `You left something in your cart at ${siteName}`,
    html: buildHtml(checkout),
    headers: {
      "List-Unsubscribe": "<{{{RESEND_UNSUBSCRIBE_URL}}}>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
