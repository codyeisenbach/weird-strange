-- abandoned_checkouts holds customer emails and live checkout URLs; it is
-- only ever read/written via the service-role key (webhook handlers, cron
-- route), which bypasses RLS. Enabling RLS with no policies blocks all
-- access via the anon/publishable key.
alter table public.abandoned_checkouts enable row level security;
