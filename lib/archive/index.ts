import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  updateTag,
} from "next/cache";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getProducts } from "lib/shopify";
import { getSupabaseServerClient } from "lib/supabase/server";
import { getR2BucketName, getR2Client } from "lib/r2/client";
import type { Product } from "lib/shopify/types";
import {
  Artist,
  ArtistDetail,
  Artwork,
  ArtworkDetail,
  Publication,
  PublicationDetail,
} from "./types";

export const ARCHIVE_TAGS = {
  artists: "archive-artists",
  publications: "archive-publications",
  artworks: "archive-artworks",
};

const ALL_ARCHIVE_TAGS = [
  ARCHIVE_TAGS.artists,
  ARCHIVE_TAGS.publications,
  ARCHIVE_TAGS.artworks,
] as const;

type ArtistRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  image_path: string | null;
  image_alt: string | null;
};

type PublicationRow = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  image_path: string | null;
  image_alt: string | null;
};

type ArtworkRow = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  image_path: string | null;
  image_alt: string | null;
  placement: string | null;
};

const imageBaseUrl = process.env.NEXT_PUBLIC_ARCHIVE_IMAGE_BASE_URL;

// `image_path` is a relative object key within the R2 bucket (e.g.
// `archive/publications/foo/bar.jpg`), not a full URL, so it must be
// resolved against the bucket's public base URL.
const resolveImagePath = (path: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!imageBaseUrl) {
    console.error(
      "NEXT_PUBLIC_ARCHIVE_IMAGE_BASE_URL is not set; cannot resolve archive image path:",
      path,
    );
    return null;
  }
  return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

// Resolves archive-linked product handles to real Shopify products, in the
// order the handles were given, dropping any that no longer exist.
const resolveProducts = async (handles: string[]): Promise<Product[]> => {
  if (handles.length === 0) return [];

  const query = handles.map((handle) => `handle:${handle}`).join(" OR ");
  const products = await getProducts({ query });
  const productsByHandle = new Map(
    products.map((product) => [product.handle, product]),
  );

  return handles
    .map((handle) => productsByHandle.get(handle))
    .filter((product): product is Product => Boolean(product));
};

const reshapeArtist = (row: ArtistRow): Artist => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  createdAt: row.created_at,
  imagePath: resolveImagePath(row.image_path),
  imageAlt: row.image_alt,
});

const reshapePublication = (row: PublicationRow): Publication => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  createdAt: row.created_at,
  imagePath: resolveImagePath(row.image_path),
  imageAlt: row.image_alt,
});

const reshapeArtwork = (row: ArtworkRow): Artwork => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  createdAt: row.created_at,
  imagePath: resolveImagePath(row.image_path),
  imageAlt: row.image_alt,
  placement: row.placement,
});

// Dedupes rows by id, ordering groups by the earliest `created_at` among
// the artwork rows that reference them. Used to derive an artist's
// publications (and vice versa) from their shared artworks, replacing the
// old manually-curated artist_publications join table.
function dedupeByEarliestArtwork<T extends { id: string }>(
  entries: { createdAt: string; value: T }[],
): T[] {
  const earliestById = new Map<string, { createdAt: string; value: T }>();

  for (const entry of entries) {
    const existing = earliestById.get(entry.value.id);
    if (!existing || entry.createdAt < existing.createdAt) {
      earliestById.set(entry.value.id, entry);
    }
  }

  return Array.from(earliestById.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry) => entry.value);
}

export async function getArtists(): Promise<Artist[]> {
  "use cache";
  cacheTag(ARCHIVE_TAGS.artists);
  cacheLife("days");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, created_at, image_path, image_alt")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch artists:", error.message);
    return [];
  }

  return (data ?? []).map(reshapeArtist);
}

export async function getPublications(): Promise<Publication[]> {
  "use cache";
  cacheTag(ARCHIVE_TAGS.publications);
  cacheLife("days");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("publications")
    .select("id, slug, title, created_at, image_path, image_alt")
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to fetch publications:", error.message);
    return [];
  }

  return (data ?? []).map(reshapePublication);
}

export async function getArtworks(): Promise<Artwork[]> {
  "use cache";
  cacheTag(ARCHIVE_TAGS.artworks);
  cacheLife("days");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("id, slug, title, created_at, image_path, image_alt, placement")
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to fetch artworks:", error.message);
    return [];
  }

  return (data ?? []).map(reshapeArtwork);
}

// Fetches the artworks belonging to one artist or publication, along with
// the distinct publications/artists and product handles derived from them.
// Shared by getArtist/getPublication since both sides need the same shape
// of query, just filtered on a different foreign key.
async function getArtworksFor(
  filterColumn: "artist_id" | "publication_id",
  id: string,
): Promise<{
  artworks: Artwork[];
  // Paired 1:1 with `artworks` by index — `linkedArtists[i]`/`linkedPublications[i]`
  // is the artist/publication (or null) belonging to `artworks[i]`.
  linkedArtists: (ArtistRow | null)[];
  linkedPublications: (PublicationRow | null)[];
  productHandles: string[];
}> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("artworks")
    .select(
      "id, slug, title, created_at, image_path, image_alt, placement, " +
        "artists(id, slug, name, created_at, image_path, image_alt), " +
        "publications(id, slug, title, created_at, image_path, image_alt), " +
        "artwork_products(shopify_product_id)",
    )
    .eq(filterColumn, id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      `Failed to fetch artworks for ${filterColumn} '${id}':`,
      error.message,
    );
    return {
      artworks: [],
      linkedArtists: [],
      linkedPublications: [],
      productHandles: [],
    };
  }

  // Supabase's untyped client can't statically parse this query's nested
  // embedded-resource selects (three joined resources plus scalar columns
  // in one call) and falls back to a `GenericStringError` element type —
  // cast each row through `unknown` up front rather than per-property.
  const rows = (data ?? []) as unknown as (ArtworkRow & {
    artists: ArtistRow | null;
    publications: PublicationRow | null;
    artwork_products: { shopify_product_id: string }[] | null;
  })[];

  const artworks = rows.map((row) => reshapeArtwork(row));

  const linkedArtists = rows.map((row) => row.artists);

  const linkedPublications = rows.map((row) => row.publications);

  const productHandles = rows.flatMap(
    (row) => row.artwork_products?.map((link) => link.shopify_product_id) ?? [],
  );

  return { artworks, linkedArtists, linkedPublications, productHandles };
}

export async function getArtist(
  slug: string,
): Promise<ArtistDetail | undefined> {
  "use cache";
  cacheTag(...ALL_ARCHIVE_TAGS);
  cacheLife("days");

  const supabase = getSupabaseServerClient();

  const { data: artistRow, error: artistError } = await supabase
    .from("artists")
    .select("id, slug, name, created_at, image_path, image_alt, bio")
    .eq("slug", slug)
    .maybeSingle();

  if (artistError) {
    console.error(`Failed to fetch artist '${slug}':`, artistError.message);
    return undefined;
  }

  if (!artistRow) return undefined;

  const { artworks, linkedPublications, productHandles } = await getArtworksFor(
    "artist_id",
    artistRow.id,
  );

  const publications = dedupeByEarliestArtwork(
    artworks
      .map((artwork, index) => {
        const publicationRow = linkedPublications[index];
        return publicationRow
          ? {
              createdAt: artwork.createdAt,
              value: reshapePublication(publicationRow),
            }
          : undefined;
      })
      .filter((entry): entry is { createdAt: string; value: Publication } =>
        Boolean(entry),
      ),
  );

  const products = await resolveProducts(productHandles);

  return {
    ...reshapeArtist(artistRow),
    bio: artistRow.bio,
    publications,
    products,
    artworks,
  };
}

export async function getPublication(
  slug: string,
): Promise<PublicationDetail | undefined> {
  "use cache";
  cacheTag(...ALL_ARCHIVE_TAGS);
  cacheLife("days");

  const supabase = getSupabaseServerClient();

  const { data: publicationRow, error: publicationError } = await supabase
    .from("publications")
    .select("id, slug, title, created_at, image_path, image_alt, description")
    .eq("slug", slug)
    .maybeSingle();

  if (publicationError) {
    console.error(
      `Failed to fetch publication '${slug}':`,
      publicationError.message,
    );
    return undefined;
  }

  if (!publicationRow) return undefined;

  const { artworks, linkedArtists, productHandles } = await getArtworksFor(
    "publication_id",
    publicationRow.id,
  );

  const artists = dedupeByEarliestArtwork(
    artworks
      .map((artwork, index) => {
        const artistRow = linkedArtists[index];
        return artistRow
          ? { createdAt: artwork.createdAt, value: reshapeArtist(artistRow) }
          : undefined;
      })
      .filter((entry): entry is { createdAt: string; value: Artist } =>
        Boolean(entry),
      ),
  );

  const products = await resolveProducts(productHandles);

  return {
    ...reshapePublication(publicationRow),
    description: publicationRow.description,
    artists,
    products,
    artworks,
  };
}

export async function getArtwork(
  slug: string,
): Promise<ArtworkDetail | undefined> {
  "use cache";
  cacheTag(...ALL_ARCHIVE_TAGS);
  cacheLife("days");

  const supabase = getSupabaseServerClient();

  const { data: artworkRow, error: artworkError } = await supabase
    .from("artworks")
    .select(
      "id, slug, title, created_at, image_path, image_alt, placement, description, " +
        "artists(id, slug, name, created_at, image_path, image_alt), " +
        "publications(id, slug, title, created_at, image_path, image_alt), " +
        "artwork_products(shopify_product_id)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (artworkError) {
    console.error(`Failed to fetch artwork '${slug}':`, artworkError.message);
    return undefined;
  }

  if (!artworkRow) return undefined;

  // Same GenericStringError fallback as getArtworksFor() above — cast the
  // whole row through `unknown` before accessing the joined resources.
  const row = artworkRow as unknown as ArtworkRow & {
    description: string | null;
    artists: ArtistRow | null;
    publications: PublicationRow | null;
    artwork_products: { shopify_product_id: string }[] | null;
  };

  const artistRow = row.artists;
  if (!artistRow) {
    // artist_id is NOT NULL at the DB level, so this only happens if the
    // artist row itself was deleted out from under the FK (shouldn't
    // happen given ON DELETE CASCADE) — treat as missing rather than
    // returning an ArtworkDetail with no artist.
    console.error(`Artwork '${slug}' has no resolvable artist.`);
    return undefined;
  }

  const publicationRow = row.publications;

  const productHandles = (row.artwork_products ?? []).map(
    (link) => link.shopify_product_id,
  );
  const products = await resolveProducts(productHandles);

  return {
    ...reshapeArtwork(row),
    description: row.description,
    artist: reshapeArtist(artistRow),
    publication: publicationRow ? reshapePublication(publicationRow) : null,
    products,
  };
}

// Reverse of every other artwork query in this file — those all start from
// an artwork/artist/publication and resolve outward to product handles;
// this starts from a Shopify product handle and resolves back to the
// artwork(s) that reference it (for embedding artist/publication
// structured data on the product page). A product isn't expected to be
// linked from more than one artwork in practice, but the schema (and this
// return type) allows it, so callers should handle zero, one, or many.
export async function getArtworksForProductHandle(
  handle: string,
): Promise<ArtworkDetail[]> {
  "use cache";
  cacheTag(...ALL_ARCHIVE_TAGS);
  cacheLife("days");

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("artworks")
    .select(
      "id, slug, title, created_at, image_path, image_alt, placement, description, " +
        "artists(id, slug, name, created_at, image_path, image_alt), " +
        "publications(id, slug, title, created_at, image_path, image_alt), " +
        "artwork_products!inner(shopify_product_id)",
    )
    .eq("artwork_products.shopify_product_id", handle);

  if (error) {
    console.error(
      `Failed to fetch artworks for product handle '${handle}':`,
      error.message,
    );
    return [];
  }

  // Same GenericStringError fallback as getArtworksFor()/getArtwork() above.
  const rows = (data ?? []) as unknown as (ArtworkRow & {
    description: string | null;
    artists: ArtistRow | null;
    publications: PublicationRow | null;
  })[];

  return rows
    .filter((row): row is typeof row & { artists: ArtistRow } =>
      Boolean(row.artists),
    )
    .map((row) => ({
      ...reshapeArtwork(row),
      description: row.description,
      artist: reshapeArtist(row.artists),
      publication: row.publications
        ? reshapePublication(row.publications)
        : null,
      products: [],
    }));
}

export type ArtistTextEdit = {
  name: string;
  bio: string;
};

export type PublicationTextEdit = {
  title: string;
  description: string;
};

export type ArtworkEdit = {
  title: string;
  artistId: string;
  publicationId: string | null;
  placement: string | null;
  description: string;
};

// Writes go through the secret-key (service_role) client, bypassing RLS —
// callers are responsible for authorization (see requireAdmin() in
// lib/admin/auth.ts). RLS on these tables only grants public `select`;
// there's no `authenticated`-role policy for admin writes because "admin"
// here is an app-level allowlist, not a Supabase Auth role.
export async function updateArtist(
  id: string,
  edit: ArtistTextEdit,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("artists")
    .update({ name: edit.name, bio: edit.bio || null })
    .eq("id", id);

  if (error) {
    console.error(`Failed to update artist '${id}':`, error.message);
    return { error: "Failed to save changes." };
  }

  // Also busts artworks: an artist's name is embedded on any artwork
  // detail page that links to them.
  updateTag(ARCHIVE_TAGS.artists);
  updateTag(ARCHIVE_TAGS.artworks);
  return {};
}

export async function updatePublication(
  id: string,
  edit: PublicationTextEdit,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("publications")
    .update({ title: edit.title, description: edit.description || null })
    .eq("id", id);

  if (error) {
    console.error(`Failed to update publication '${id}':`, error.message);
    return { error: "Failed to save changes." };
  }

  updateTag(ARCHIVE_TAGS.publications);
  updateTag(ARCHIVE_TAGS.artworks);
  return {};
}

export async function updateArtwork(
  id: string,
  edit: ArtworkEdit,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("artworks")
    .update({
      title: edit.title,
      artist_id: edit.artistId,
      publication_id: edit.publicationId,
      placement: edit.placement || null,
      description: edit.description || null,
    })
    .eq("id", id);

  if (error) {
    console.error(`Failed to update artwork '${id}':`, error.message);
    return { error: "Failed to save changes." };
  }

  // An artwork edit can change which artist/publication it's linked to, so
  // all three tags need busting rather than just archive-artworks.
  updateTag(ARCHIVE_TAGS.artworks);
  updateTag(ARCHIVE_TAGS.artists);
  updateTag(ARCHIVE_TAGS.publications);
  return {};
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const POSTGRES_UNIQUE_VIOLATION = "23505";
const MAX_SLUG_ATTEMPTS = 20;

// Inserts a row, retrying with a numeric-suffixed slug (name-2, name-3, …)
// on a unique-constraint collision. The DB's unique index on `slug` is the
// actual source of truth for uniqueness — this just makes collisions
// self-resolving instead of a dead end for the admin filling out the form.
async function insertWithUniqueSlug<T extends { slug: string }>(
  table: "artists" | "publications" | "artworks",
  baseSlug: string,
  buildRow: (slug: string) => Record<string, unknown>,
): Promise<{ row?: T; error?: string }> {
  const supabase = getSupabaseServerClient();

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data, error } = await supabase
      .from(table)
      .insert(buildRow(slug))
      .select()
      .single();

    if (!error) return { row: data as T };
    if (error.code !== POSTGRES_UNIQUE_VIOLATION) {
      console.error(`Failed to create ${table} row:`, error.message);
      return { error: "Failed to create entry." };
    }
    // Unique violation on slug — loop and try the next suffix.
  }

  return { error: "Could not generate a unique URL for this entry." };
}

export async function createArtist(
  name: string,
  bio: string,
): Promise<{ slug?: string; error?: string }> {
  const baseSlug = slugify(name);
  if (!baseSlug) return { error: "Name must contain at least one letter." };

  const { row, error } = await insertWithUniqueSlug<{ slug: string }>(
    "artists",
    baseSlug,
    (slug) => ({ slug, name, bio: bio || null }),
  );

  if (error || !row) return { error };

  updateTag(ARCHIVE_TAGS.artists);
  return { slug: row.slug };
}

export async function createPublication(
  title: string,
  description: string,
): Promise<{ slug?: string; error?: string }> {
  const baseSlug = slugify(title);
  if (!baseSlug) return { error: "Title must contain at least one letter." };

  const { row, error } = await insertWithUniqueSlug<{ slug: string }>(
    "publications",
    baseSlug,
    (slug) => ({ slug, title, description: description || null }),
  );

  if (error || !row) return { error };

  updateTag(ARCHIVE_TAGS.publications);
  return { slug: row.slug };
}

export async function createArtwork(
  title: string,
  artistId: string,
  publicationId: string | null,
  placement: string | null,
  description: string,
  productHandles: string[] = [],
  image: File | null = null,
): Promise<{ slug?: string; error?: string }> {
  const baseSlug = slugify(title);
  if (!baseSlug) return { error: "Title must contain at least one letter." };

  const { row, error } = await insertWithUniqueSlug<{
    id: string;
    slug: string;
  }>("artworks", baseSlug, (slug) => ({
    slug,
    title,
    artist_id: artistId,
    publication_id: publicationId,
    placement: placement || null,
    description: description || null,
  }));

  if (error || !row) return { error };

  if (productHandles.length > 0) {
    const supabase = getSupabaseServerClient();
    const { error: linkError } = await supabase.from("artwork_products").insert(
      productHandles.map((handle) => ({
        artwork_id: row.id,
        shopify_product_id: handle,
      })),
    );

    if (linkError) {
      // The artwork itself was created successfully — a failure here only
      // means the product links didn't take, which the admin can retry
      // from the artwork's detail page. Not worth failing the whole create.
      console.error(
        `Artwork '${row.slug}' created, but failed to link products:`,
        linkError.message,
      );
    }
  }

  if (image) {
    // Same reasoning as the product-link failure above: the artwork
    // already exists, so an image upload failure shouldn't fail the whole
    // create — the admin can retry the upload from the detail page.
    const { error: imageError } = await uploadArtworkImage(
      row.id,
      row.slug,
      image,
    );
    if (imageError) {
      console.error(
        `Artwork '${row.slug}' created, but failed to upload image:`,
        imageError,
      );
    }
  }

  updateTag(ARCHIVE_TAGS.artworks);
  updateTag(ARCHIVE_TAGS.artists);
  updateTag(ARCHIVE_TAGS.publications);
  return { slug: row.slug };
}

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Public archive images are downscaled + re-encoded before they ever reach
// R2 — these are AI-restored/upscaled scans of public-domain pulp covers,
// and the restoration work itself (unlike the underlying art) is worth
// protecting from being lifted at full quality for someone else's merch.
// This isn't a hard block (a downscaled web image can still be
// screenshotted), just a deterrent: keep full-resolution masters out of
// the publicly-served path entirely, upload only a capped web version.
// Admins should keep their full-res source files themselves — this
// pipeline never stores or has access to the original bytes past request
// scope.
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 85;

export async function uploadArtworkImage(
  artworkId: string,
  artworkSlug: string,
  file: File,
  imageAlt?: string,
): Promise<{ imagePath?: string; error?: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "File must be a JPEG, PNG, WebP, or GIF image." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "Image must be smaller than 8MB." };
  }

  let resized: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    resized = await sharp(await file.arrayBuffer())
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("webp", { quality: WEBP_QUALITY })
      .toBuffer();
  } catch (resizeError) {
    console.error(
      `Failed to process image for artwork '${artworkId}':`,
      resizeError,
    );
    return { error: "Failed to process image." };
  }

  // Randomized filename prefix avoids two problems at once: a collision if
  // two admins upload same-named files for different artworks, and stale
  // browser/CDN caching if an admin re-uploads a replacement image under
  // the same original filename (the object key changes, so it's a cache
  // miss rather than serving the old bytes). Always .webp since every
  // upload is re-encoded to that format above, regardless of source type.
  const key = `archive/artworks/${artworkSlug}/${crypto.randomUUID()}.webp`;

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        Body: resized,
        ContentType: "image/webp",
      }),
    );
  } catch (uploadError) {
    console.error(
      `Failed to upload image for artwork '${artworkId}':`,
      uploadError,
    );
    return { error: "Failed to upload image." };
  }

  const supabase = getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("artworks")
    .update({
      image_path: key,
      ...(imageAlt !== undefined ? { image_alt: imageAlt || null } : {}),
    })
    .eq("id", artworkId);

  if (dbError) {
    console.error(
      `Uploaded image for artwork '${artworkId}', but failed to save image_path:`,
      dbError.message,
    );
    return { error: "Image uploaded, but failed to save." };
  }

  updateTag(ARCHIVE_TAGS.artworks);
  updateTag(ARCHIVE_TAGS.artists);
  updateTag(ARCHIVE_TAGS.publications);
  // `imagePath` here is the resolved public URL (same shape as
  // Artwork.imagePath elsewhere), not the raw R2 object key, so callers
  // can render it directly without knowing about resolveImagePath().
  return { imagePath: resolveImagePath(key) ?? undefined };
}

export async function getArtworkProducts(
  artworkId: string,
): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("artwork_products")
    .select("shopify_product_id")
    .eq("artwork_id", artworkId);

  if (error) {
    console.error(
      `Failed to fetch products for artwork '${artworkId}':`,
      error.message,
    );
    return [];
  }

  const handles = (data ?? []).map((row) => row.shopify_product_id);
  return resolveProducts(handles);
}

export async function linkArtworkProduct(
  artworkId: string,
  shopifyProductHandle: string,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("artwork_products").insert({
    artwork_id: artworkId,
    shopify_product_id: shopifyProductHandle,
  });

  if (error) {
    console.error(
      `Failed to link product '${shopifyProductHandle}' to artwork '${artworkId}':`,
      error.message,
    );
    return { error: "Failed to link product." };
  }

  updateTag(ARCHIVE_TAGS.artworks);
  return {};
}

export async function unlinkArtworkProduct(
  artworkId: string,
  shopifyProductHandle: string,
): Promise<{ error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("artwork_products")
    .delete()
    .eq("artwork_id", artworkId)
    .eq("shopify_product_id", shopifyProductHandle);

  if (error) {
    console.error(
      `Failed to unlink product '${shopifyProductHandle}' from artwork '${artworkId}':`,
      error.message,
    );
    return { error: "Failed to unlink product." };
  }

  updateTag(ARCHIVE_TAGS.artworks);
  return {};
}
