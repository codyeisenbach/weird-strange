drop extension if exists "pg_net";


  create table "public"."artist_products" (
    "artist_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "shopify_product_id" text not null
      );


alter table "public"."artist_products" enable row level security;


  create table "public"."artist_publications" (
    "artist_id" uuid not null,
    "publication_id" uuid not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."artist_publications" enable row level security;


  create table "public"."artists" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "image_path" text,
    "image_alt" text,
    "bio" text
      );


alter table "public"."artists" enable row level security;


  create table "public"."publication_products" (
    "publication_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "shopify_product_id" text not null
      );


alter table "public"."publication_products" enable row level security;


  create table "public"."publications" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "created_at" timestamp with time zone not null default now(),
    "image_path" text,
    "image_alt" text,
    "description" text
      );


alter table "public"."publications" enable row level security;

CREATE UNIQUE INDEX artist_products_pkey ON public.artist_products USING btree (artist_id, shopify_product_id);

CREATE UNIQUE INDEX artist_publications_pkey ON public.artist_publications USING btree (artist_id, publication_id);

CREATE UNIQUE INDEX artists_pkey ON public.artists USING btree (id);

CREATE UNIQUE INDEX artists_slug_key ON public.artists USING btree (slug);

CREATE INDEX idx_artist_publications_publication_id ON public.artist_publications USING btree (publication_id, sort_order);

CREATE UNIQUE INDEX publication_products_pkey ON public.publication_products USING btree (publication_id, shopify_product_id);

CREATE UNIQUE INDEX publications_pkey ON public.publications USING btree (id);

CREATE UNIQUE INDEX publications_slug_key ON public.publications USING btree (slug);

alter table "public"."artist_products" add constraint "artist_products_pkey" PRIMARY KEY using index "artist_products_pkey";

alter table "public"."artist_publications" add constraint "artist_publications_pkey" PRIMARY KEY using index "artist_publications_pkey";

alter table "public"."artists" add constraint "artists_pkey" PRIMARY KEY using index "artists_pkey";

alter table "public"."publication_products" add constraint "publication_products_pkey" PRIMARY KEY using index "publication_products_pkey";

alter table "public"."publications" add constraint "publications_pkey" PRIMARY KEY using index "publications_pkey";

alter table "public"."artist_products" add constraint "artist_products_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE not valid;

alter table "public"."artist_products" validate constraint "artist_products_artist_id_fkey";

alter table "public"."artist_publications" add constraint "artist_publications_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE not valid;

alter table "public"."artist_publications" validate constraint "artist_publications_artist_id_fkey";

alter table "public"."artist_publications" add constraint "artist_publications_publication_id_fkey" FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE not valid;

alter table "public"."artist_publications" validate constraint "artist_publications_publication_id_fkey";

alter table "public"."artists" add constraint "artists_slug_key" UNIQUE using index "artists_slug_key";

alter table "public"."publication_products" add constraint "publication_products_publication_id_fkey" FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE not valid;

alter table "public"."publication_products" validate constraint "publication_products_publication_id_fkey";

alter table "public"."publications" add constraint "publications_slug_key" UNIQUE using index "publications_slug_key";

grant delete on table "public"."artist_products" to "anon";

grant insert on table "public"."artist_products" to "anon";

grant references on table "public"."artist_products" to "anon";

grant select on table "public"."artist_products" to "anon";

grant trigger on table "public"."artist_products" to "anon";

grant truncate on table "public"."artist_products" to "anon";

grant update on table "public"."artist_products" to "anon";

grant delete on table "public"."artist_products" to "authenticated";

grant insert on table "public"."artist_products" to "authenticated";

grant references on table "public"."artist_products" to "authenticated";

grant select on table "public"."artist_products" to "authenticated";

grant trigger on table "public"."artist_products" to "authenticated";

grant truncate on table "public"."artist_products" to "authenticated";

grant update on table "public"."artist_products" to "authenticated";

grant delete on table "public"."artist_products" to "service_role";

grant insert on table "public"."artist_products" to "service_role";

grant references on table "public"."artist_products" to "service_role";

grant select on table "public"."artist_products" to "service_role";

grant trigger on table "public"."artist_products" to "service_role";

grant truncate on table "public"."artist_products" to "service_role";

grant update on table "public"."artist_products" to "service_role";

grant delete on table "public"."artist_publications" to "anon";

grant insert on table "public"."artist_publications" to "anon";

grant references on table "public"."artist_publications" to "anon";

grant select on table "public"."artist_publications" to "anon";

grant trigger on table "public"."artist_publications" to "anon";

grant truncate on table "public"."artist_publications" to "anon";

grant update on table "public"."artist_publications" to "anon";

grant delete on table "public"."artist_publications" to "authenticated";

grant insert on table "public"."artist_publications" to "authenticated";

grant references on table "public"."artist_publications" to "authenticated";

grant select on table "public"."artist_publications" to "authenticated";

grant trigger on table "public"."artist_publications" to "authenticated";

grant truncate on table "public"."artist_publications" to "authenticated";

grant update on table "public"."artist_publications" to "authenticated";

grant delete on table "public"."artist_publications" to "service_role";

grant insert on table "public"."artist_publications" to "service_role";

grant references on table "public"."artist_publications" to "service_role";

grant select on table "public"."artist_publications" to "service_role";

grant trigger on table "public"."artist_publications" to "service_role";

grant truncate on table "public"."artist_publications" to "service_role";

grant update on table "public"."artist_publications" to "service_role";

grant delete on table "public"."artists" to "anon";

grant insert on table "public"."artists" to "anon";

grant references on table "public"."artists" to "anon";

grant select on table "public"."artists" to "anon";

grant trigger on table "public"."artists" to "anon";

grant truncate on table "public"."artists" to "anon";

grant update on table "public"."artists" to "anon";

grant delete on table "public"."artists" to "authenticated";

grant insert on table "public"."artists" to "authenticated";

grant references on table "public"."artists" to "authenticated";

grant select on table "public"."artists" to "authenticated";

grant trigger on table "public"."artists" to "authenticated";

grant truncate on table "public"."artists" to "authenticated";

grant update on table "public"."artists" to "authenticated";

grant delete on table "public"."artists" to "service_role";

grant insert on table "public"."artists" to "service_role";

grant references on table "public"."artists" to "service_role";

grant select on table "public"."artists" to "service_role";

grant trigger on table "public"."artists" to "service_role";

grant truncate on table "public"."artists" to "service_role";

grant update on table "public"."artists" to "service_role";

grant delete on table "public"."publication_products" to "anon";

grant insert on table "public"."publication_products" to "anon";

grant references on table "public"."publication_products" to "anon";

grant select on table "public"."publication_products" to "anon";

grant trigger on table "public"."publication_products" to "anon";

grant truncate on table "public"."publication_products" to "anon";

grant update on table "public"."publication_products" to "anon";

grant delete on table "public"."publication_products" to "authenticated";

grant insert on table "public"."publication_products" to "authenticated";

grant references on table "public"."publication_products" to "authenticated";

grant select on table "public"."publication_products" to "authenticated";

grant trigger on table "public"."publication_products" to "authenticated";

grant truncate on table "public"."publication_products" to "authenticated";

grant update on table "public"."publication_products" to "authenticated";

grant delete on table "public"."publication_products" to "service_role";

grant insert on table "public"."publication_products" to "service_role";

grant references on table "public"."publication_products" to "service_role";

grant select on table "public"."publication_products" to "service_role";

grant trigger on table "public"."publication_products" to "service_role";

grant truncate on table "public"."publication_products" to "service_role";

grant update on table "public"."publication_products" to "service_role";

grant delete on table "public"."publications" to "anon";

grant insert on table "public"."publications" to "anon";

grant references on table "public"."publications" to "anon";

grant select on table "public"."publications" to "anon";

grant trigger on table "public"."publications" to "anon";

grant truncate on table "public"."publications" to "anon";

grant update on table "public"."publications" to "anon";

grant delete on table "public"."publications" to "authenticated";

grant insert on table "public"."publications" to "authenticated";

grant references on table "public"."publications" to "authenticated";

grant select on table "public"."publications" to "authenticated";

grant trigger on table "public"."publications" to "authenticated";

grant truncate on table "public"."publications" to "authenticated";

grant update on table "public"."publications" to "authenticated";

grant delete on table "public"."publications" to "service_role";

grant insert on table "public"."publications" to "service_role";

grant references on table "public"."publications" to "service_role";

grant select on table "public"."publications" to "service_role";

grant trigger on table "public"."publications" to "service_role";

grant truncate on table "public"."publications" to "service_role";

grant update on table "public"."publications" to "service_role";


  create policy "Public read access"
  on "public"."artist_products"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read access"
  on "public"."artist_publications"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read access"
  on "public"."artists"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read access"
  on "public"."publication_products"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read access"
  on "public"."publications"
  as permissive
  for select
  to anon, authenticated
using (true);



