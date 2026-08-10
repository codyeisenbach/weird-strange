---
name: run-weird-strange
description: Start and verify the Weird Strange Next.js app locally (storefront, /archive, /admin). Use when asked to run, start, or check that the app/a change works, or before testing a UI change in the browser.
---

# Running Weird Strange locally

## Start

```bash
pnpm install   # first time / after dependency changes
pnpm dev       # next dev --turbopack, defaults to :3000
```

**Before starting a new dev server, check port 3000 first** (`lsof -ti :3000`). This project is frequently run from the IDE already — if something's listening, assume it's the user's own dev server, don't kill it, and just curl against it instead of spawning a second instance. `next dev` will silently pick :3001 if :3000 is busy, which produces confusing "it's not working" results if you don't notice the port shift.

## Env vars (`.env.local`)

Required for the app to function at all:

- `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN`, `SHOPIFY_REVALIDATION_SECRET` — storefront/cart/checkout
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` — `/archive` reads + `/admin` auth
- `NEXT_PUBLIC_ARCHIVE_IMAGE_BASE_URL` — external bucket base URL for archive images

Only needed for specific features:

- `SHOPIFY_SHOP_ID`, `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` — `/account` (Shopify Customer Account OAuth). Without these, `/account` renders a "not configured" message instead of erroring — that's expected, not a bug.
- `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL` — `/admin`. `ADMIN_EMAILS` is comma-separated (one email is valid); it's the sole authorization check, unrelated to any Supabase role.
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN`, `PRINTIFY_*`, `WEIRD_STRANGE_PRINTIFY_TOKEN` — Printify → Shopify product sync webhook, not needed for local browsing.
- `COMING_SOON=true` gates the whole site behind `/coming-soon`, but only for hostnames in `GATED_HOSTS` in `middleware.ts` (production domains) — it does **not** affect `localhost`, so leaving it `true` locally is fine and won't block testing.

## Verifying a change works

Prefer `curl -s -o /dev/null -w "%{http_code}\n"` for a quick route sanity check before reaching for a browser:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/                          # storefront home
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/archive/artists            # archive list
curl -s -D - -o /dev/null http://localhost:3000/admin | grep -i location                  # should 307 -> /admin/login when signed out
```

For anything visual (layout, styling, interactive components, cart/checkout flow) — actually open it in a browser and test the golden path, per the project's UI-change testing standard. Route-level curl checks only confirm the server didn't error; they don't confirm the feature works.

## `/admin` auth specifics

- Magic link and Google OAuth both land on `/admin/auth/callback`, which is deliberately exempt from the `/admin` middleware gate (it's what establishes the session).
- Signup is disabled project-wide (`shouldCreateUser: false`, and `enable_signup = false` in `supabase/config.toml` + the hosted Supabase dashboard) — only pre-existing Supabase Auth accounts can sign in. If testing with a fresh email, it needs an existing account first; a magic link to an unknown address will not create one.
- The dashboard's redirect-URL allowlist (Authentication → URL Configuration) must include `http://localhost:3000/admin/auth/callback` for local magic-link/OAuth callbacks to be honored — this is hosted-Supabase-project config, not something in this repo.

## Build / lint

```bash
pnpm prettier:check   # also runs as `pnpm test`
pnpm build
npx tsc --noEmit -p tsconfig.json
```
