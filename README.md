# Weird Strange

A Next.js storefront for Weird Strange, built on a fork of Next.js Commerce. Product data and checkout run through Shopify; a Supabase-backed archive and an internal admin area extend it beyond a standard storefront.

## Stack

- **Next.js 15** (App Router, PPR, `"use cache"`) + React 19, Tailwind CSS 4
- **Shopify** Storefront API for products/collections/cart, Customer Account API (OAuth) for `/account`
- **Supabase** (Postgres + Auth) for the `/archive` content and `/admin` authentication
- Deployed on Vercel

## Running locally

```bash
pnpm install
pnpm dev
```

Requires environment variables for Shopify and Supabase — see `.env.local`. Pull production values with `vercel env pull` if you have project access.

```bash
pnpm prettier:check   # also runs as `pnpm test`
pnpm build
```

## Project structure

- `app/` — routes: storefront (`/product`, `/collections`, `/search`), `/account` (Shopify customer auth), `/archive` (Supabase-backed), `/admin` (internal, Supabase-authenticated)
- `lib/shopify/` — Storefront/Admin API clients and Customer Account OAuth
- `lib/supabase/` — Supabase clients (secret-key server client, cookie-based auth server/browser/middleware clients)
- `lib/archive/` — archive data-fetching, joins Supabase content to live Shopify products
- `lib/admin/` — admin authorization (allowlist + session check)
- `supabase/migrations/` — schema for the `archive` and admin auth setup

## Features implemented in this repo (beyond the Commerce template)

### `/archive` — Supabase-backed Wikipedia-style archive

Read-only reference section for artists and publications, independent of the Shopify catalog.

- Schema: `artists`, `publications`, plus join tables `artist_publications` (many-to-many, ordered via `sort_order`) and `artist_products` / `publication_products` (link a Shopify product **handle** to an artist/publication)
- `lib/archive/index.ts` reads via a server-only Supabase client (secret key, RLS with public `select` policies), then resolves linked product handles to live Shopify products with a single `handle:x OR handle:y` Storefront query, preserving link order and dropping stale handles
- Cached with `"use cache"` / `cacheTag` / `cacheLife("days")`, tagged `archive-artists` / `archive-publications`
- Images are relative object keys resolved against `NEXT_PUBLIC_ARCHIVE_IMAGE_BASE_URL` (external bucket, not Supabase Storage)
- Routes: `/archive`, `/archive/artists[/​slug]`, `/archive/publications[/​slug]`, rendered with Wikipedia-style infobox/article components

### `/admin` — protected internal tooling

Supabase Auth (magic link + Google OAuth) gating an admin area, authorized against an email allowlist rather than any Supabase role.

- **Authentication**: `@supabase/ssr` cookie-based sessions. Magic link via `signInWithOtp` (`shouldCreateUser: false` — signup is disabled project-wide, only existing accounts can sign in); Google OAuth via `signInWithOAuth`, PKCE `code` exchange. Both flows land on one callback route (`/admin/auth/callback`) that handles either `token_hash`/`type` or `code`
- **Authorization**: `ADMIN_EMAILS` env var (comma-separated, case-insensitive) is the sole authorization boundary — `lib/admin/allowlist.ts#isAdminEmail`. Authentication proves identity; this decides access
- **Two-layer gate**: `middleware.ts` refreshes the session and checks the allowlist on every `/admin/*` request (via `getUser()`, which revalidates the JWT rather than trusting the cookie); `lib/admin/auth.ts#requireAdmin()` re-checks server-side in the `(protected)` route group's layout, so the gate holds even if the middleware matcher changes
- `/admin/login` and `/admin/auth/callback` are excluded from the gate (the callback is what establishes the session in the first place)
- Sign-in and callback both validate the post-auth redirect target is a same-origin relative path, guarding against open-redirect via a crafted `next` query param
