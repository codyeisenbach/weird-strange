-- Shopify's checkouts/create webhook payload has no top-level `id` field;
-- checkouts are identified by `token` (a non-numeric string). Table was
-- created assuming a numeric id, discovered wrong against a real webhook
-- payload. Table has no rows yet, so this is a safe in-place type change.
alter table public.abandoned_checkouts
  alter column id type text;
