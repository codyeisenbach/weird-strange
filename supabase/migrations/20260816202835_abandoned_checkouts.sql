create table if not exists public.abandoned_checkouts (
  id bigint primary key,
  email text not null,
  checkout_url text not null,
  total_price text,
  currency text,
  line_items jsonb,
  created_at timestamptz not null,
  reminder_sent_at timestamptz,
  order_id text
);

create index if not exists abandoned_checkouts_reminder_pending_idx
  on public.abandoned_checkouts (created_at)
  where reminder_sent_at is null and order_id is null;
