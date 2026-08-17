-- Replaces the direct artist/publication <-> product links and the manual
-- artist<->publication join table with `artworks` as the primary content
-- unit. All three dropped tables have zero rows and zero consumers outside
-- lib/archive/index.ts (pre-launch, no migration/back-compat concerns) --
-- the artist<->publication relationship is now derived from artworks
-- instead of separately maintained.
drop table if exists public.artist_products;
drop table if exists public.publication_products;
drop table if exists public.artist_publications;

create table "public"."artworks" (
  "id" uuid not null default gen_random_uuid(),
  "slug" text not null,
  "title" text not null,
  "artist_id" uuid not null references public.artists(id) on delete cascade,
  "publication_id" uuid references public.publications(id) on delete set null,
  "placement" text,
  "created_at" timestamp with time zone not null default now(),
  "image_path" text,
  "image_alt" text,
  "description" text
);

create unique index artworks_pkey on public.artworks using btree (id);
alter table public.artworks add constraint artworks_pkey primary key using index artworks_pkey;

create unique index artworks_slug_key on public.artworks using btree (slug);
alter table public.artworks add constraint artworks_slug_key unique using index artworks_slug_key;

create index idx_artworks_artist_id on public.artworks using btree (artist_id);
create index idx_artworks_publication_id on public.artworks using btree (publication_id);

-- Deliberately no unique constraint on (publication_id, placement): a
-- publication can have multiple front/back-cover artworks across different
-- print versions, distinguished only by their own `description` text.

create table "public"."artwork_products" (
  "artwork_id" uuid not null references public.artworks(id) on delete cascade,
  "shopify_product_id" text not null,
  "created_at" timestamp with time zone not null default now(),
  primary key (artwork_id, shopify_product_id)
);

alter table public.artworks enable row level security;
alter table public.artwork_products enable row level security;

create policy "Public read access"
  on public.artworks
  as permissive
  for select
  to anon, authenticated
  using (true);

create policy "Public read access"
  on public.artwork_products
  as permissive
  for select
  to anon, authenticated
  using (true);
