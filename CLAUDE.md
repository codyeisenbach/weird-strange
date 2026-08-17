# Weird Strange

## Analytics & server-side conversion tracking

This store sends conversion events to GA4, Meta, and Reddit from **both** the browser (client-side pixels/GTM) and the server (Shopify webhooks → each platform's Conversions API). The server-side path exists because ad blockers and iOS privacy features suppress client-side pixels, so purchase events are duplicated server-side — each platform's server call includes an event/transaction identifier derived from the Shopify order id so the platform can dedupe against any client-side pixel that also fired.

### Client-side (`lib/analytics/ecommerce.ts`)

Thin wrappers around `sendGTMEvent` (from `@next/third-parties/google`) that push standard GA4 ecommerce events through Google Tag Manager: `trackViewItem`, `trackAddToCart`, `trackRemoveFromCart`, `trackSearch`, `trackBeginCheckout`. GTM is loaded in `app/layout.tsx` via a **custom server-side GTM URL** (`gtmScriptUrl="https://data.weirdstrange.com/gtm.js"`, container `GTM-N99WWR99`) — not the default Google-hosted script — so GTM itself runs through a first-party subdomain to reduce ad-blocker interference. Don't add new client-side tracking calls without checking whether the corresponding server-side webhook event already covers it (avoid inventing more parallel event types than GA4/Meta/Reddit have documented equivalents for).

### The fbp/fbc/click-id cart-attribute bridge

**Problem this solves:** the server-side webhook handlers (`lib/analytics/order-webhook.ts`) fire from Shopify calling Vercel directly, long after checkout — there's no browser context, so they can't read first-party ad-click cookies (`_fbp`/`_fbc` for Meta, `_rdt_uuid`/`_rdt_cid` for Reddit, GA4's client_id from `_ga`) the way a client-side pixel could. Without those, server-side Purchase events only match on hashed email/phone, which scores much lower Event Match Quality on every platform.

**Mechanism:** Shopify Cart attributes are the only thing that survives from "browser has cookies" (checkout time) to "webhook fires with the completed order" (order-created time), because Shopify copies cart attributes onto the resulting Order as `note_attributes`.

- `lib/analytics/cookies.ts` — `getCookie(name)`, a minimal `document.cookie` reader. Don't grow this into a general cookie library; it's intentionally scoped to reading a few specific ad-platform cookie names.
- `components/cart/modal.tsx`'s `CheckoutButton` — right before redirecting to `cart.checkoutUrl`, reads `_fbp`, `_fbc`, `_rdt_uuid`, `_rdt_cid`, and derives a GA4 `client_id` from the `_ga` cookie (format `GA1.1.<id1>.<id2>` → GA4 wants just `<id1>.<id2>`, hence the `.split(".").slice(-2).join(".")`). Writes whichever are present as cart attributes via `updateCartAttributesAction` (`components/cart/actions.ts`, a Server Action wrapping `lib/shopify/index.ts`'s `updateCartAttributes`), racing against a timeout so a slow write never blocks the redirect to checkout.
- `lib/analytics/order-webhook.ts` — reads `order.note_attributes`, matches by name (`_fbp`, `_fbc`, `_rdt_uuid`, `_rdt_cid`, `_ga_client_id`), and feeds them into each platform's CAPI payload as **unhashed** fields (`fbp`/`fbc` for Meta, `uuid`/`click_id` for Reddit, `client_id` for GA4) — these are cookie/click identifiers, not PII, so unlike email/phone they are not hashed before sending.

**Known caveat, accepted as a tradeoff:** Shopify cart/note attributes don't always reliably survive onto the order (reported inconsistently by Shopify's own dev community). If an order's `note_attributes` is missing an expected key, that's this known limitation, not a bug — the code already falls back gracefully (e.g. GA4's `sendGA4Purchase` falls back to a synthetic `${order.id}.${order.id}` client_id when `_ga_client_id` is absent).

### Server-side webhooks (`lib/analytics/order-webhook.ts`, `app/api/webhooks/order-created/route.ts`)

Shopify's `orders/create` webhook → HMAC-verified (`isValidShopifyHmac`, using `SHOPIFY_WEBHOOK_SECRET`) → fans out via `Promise.allSettled` to `sendGA4Purchase`, `sendMetaPurchase`, `sendRedditPurchase`, and `markAbandonedCheckoutCompleted` (see below). Each platform function independently no-ops with a `console.error` if its env vars aren't configured, rather than throwing — so a misconfigured platform never blocks the others or fails the webhook response to Shopify.

Reddit-specific gotcha: the `_rdt_uuid` cookie value is `"<timestamp>.<uuid>"`; Reddit's CAPI only wants the UUID part, and it's validated against an RFC4122 regex before being sent (`isRfc4122Uuid`) — malformed/missing values are silently dropped rather than sent bad data.

`REDDIT_CAPI_TEST_ID` + a `test_id` field is only included when `VERCEL_ENV !== "production"`, so Preview/local webhook tests don't pollute real Reddit ad account data.

### Abandoned checkout recovery email

A second, related but independent pipeline — reminds customers by email if they enter an email at checkout and don't complete the purchase.

- `app/api/webhooks/checkout-created/route.ts` + `lib/analytics/checkout-webhook.ts` — Shopify's `checkouts/create` webhook (same HMAC pattern as order-created). **Important gotcha already hit once:** this payload has **no top-level `id` field** — Shopify identifies checkouts by `token` (a string), not a numeric id, unlike the Order resource. Also has no reliable top-level `total_price`; it's derived by summing `line_items[].line_price` when absent. Only upserts a row if `checkout.email` is present (no email = no way to send a reminder, skip entirely).
- Supabase table `abandoned_checkouts` (`id` is `text`, holding the checkout token) — see `supabase/migrations/2026081*_abandoned_checkouts*.sql`. RLS is enabled with **zero policies** — only the service-role key (`getSupabaseServerClient()`) can read/write it, since it holds customer emails and live checkout URLs. Never add an anon/authenticated policy to this table without a specific reason; nothing client-side should ever query it directly.
- `lib/analytics/order-webhook.ts`'s `markAbandonedCheckoutCompleted` — cross-references real orders against pending abandoned-checkout rows by matching `order.checkout_token` (not `checkout_id` — same token-vs-id distinction as above) and sets `order_id` on the matching row, so the reminder cron skips anyone who already completed checkout.
- `app/api/cron/abandoned-checkout-reminder/route.ts` — queries rows with `created_at` in a 45–75 minute-old window (a window, not just "> 1 hour", so a periodic poll doesn't double-send or miss the boundary), `reminder_sent_at IS NULL`, `order_id IS NULL`. Auth is a `Bearer ${CRON_SECRET}` header check — this must match **exactly** between Vercel's `CRON_SECRET` env var and whatever's calling it (see below).
- `lib/email/resend.ts` + `lib/email/abandoned-checkout.ts` — Resend client + HTML email (cart contents, CTA linking to `abandoned_checkout_url`), includes `List-Unsubscribe`/`List-Unsubscribe-Post` headers for CAN-SPAM compliance since this is a marketing-adjacent (not purely transactional) email.

**Why the cron lives in `cron-worker/`, not Vercel Cron:** Vercel's Hobby plan only allows once-daily cron schedules — a `*/15 * * * *` schedule in `vercel.json` causes every deploy to fail outright with a hard error, not a warning. `cron-worker/` is a **separate, standalone Cloudflare Worker** (its own `package.json`, `wrangler.jsonc`, deployed independently via `wrangler deploy`, not part of the Next.js build) whose only job is to `fetch()` the Vercel cron route every 15 minutes with the bearer secret. It is deliberately excluded from the root `tsconfig.json` (`exclude: ["cron-worker"]`) because it has its own Cloudflare Workers types (`ScheduledEvent`, `ExecutionContext` via `@cloudflare/workers-types`) that don't exist in the Next.js app's type environment — pulling it into the main typecheck breaks the build.

**Two independent secret stores that must match:** `CRON_SECRET` is set both in Vercel (env var, read by the Next.js route) and on the Cloudflare Worker (`wrangler secret put CRON_SECRET`). These are two separate systems with no automatic sync — if one is rotated without the other, the cron route silently 401s forever with no visible error except in Vercel's function logs. If the abandoned-checkout emails mysteriously stop sending, check this first via `wrangler secret list` (confirms it's *set*, not what it *is*) and comparing against Vercel's value (`vercel env pull` to a scratch file, never print the value in chat/logs).

## Deploying

`git push` to `main` triggers Vercel auto-deploy — but this has silently failed before (see cron-schedule failure above) with no obvious signal beyond the Vercel dashboard/CLI showing the last successful build is stuck on an old commit. When in doubt whether a deploy actually shipped, don't trust "I pushed" — verify with `npx vercel inspect <deployment-url> --logs | grep "Cloning github"` to confirm which commit actually built, or curl a known route and check for an unexpected 404 (route doesn't exist in the live build) vs the expected 401/200.

The `cron-worker/` Cloudflare Worker deploys independently via `cd cron-worker && npx wrangler deploy` — it is **not** triggered by pushes to `main` and has no CI wired up. A code change to `cron-worker/src/index.ts` sitting in git does nothing live until `wrangler deploy` is run manually.
