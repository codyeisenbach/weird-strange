import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getProducts } from "lib/shopify";
import { getSupabaseServerClient } from "lib/supabase/server";
import type { Product } from "lib/shopify/types";
import {
  Artist,
  ArtistDetail,
  ArtistWithSortOrder,
  Publication,
  PublicationDetail,
  PublicationWithSortOrder,
} from "./types";

export const ARCHIVE_TAGS = {
  artists: "archive-artists",
  publications: "archive-publications",
};

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

export async function getArtist(
  slug: string,
): Promise<ArtistDetail | undefined> {
  "use cache";
  cacheTag(ARCHIVE_TAGS.artists, ARCHIVE_TAGS.publications);
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

  const [publicationsResult, productsResult] = await Promise.all([
    supabase
      .from("artist_publications")
      .select(
        "sort_order, publications(id, slug, title, created_at, image_path, image_alt)",
      )
      .eq("artist_id", artistRow.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("artist_products")
      .select("shopify_product_id")
      .eq("artist_id", artistRow.id),
  ]);

  if (publicationsResult.error) {
    console.error(
      `Failed to fetch publications for artist '${slug}':`,
      publicationsResult.error.message,
    );
  }

  if (productsResult.error) {
    console.error(
      `Failed to fetch products for artist '${slug}':`,
      productsResult.error.message,
    );
  }

  const publications: PublicationWithSortOrder[] = (
    publicationsResult.data ?? []
  )
    .filter((row) => row.publications)
    .map((row) => ({
      ...reshapePublication(
        row.publications as unknown as PublicationRow,
      ),
      sortOrder: row.sort_order,
    }));

  const productHandles = (productsResult.data ?? []).map(
    (row) => row.shopify_product_id,
  );
  const products = await resolveProducts(productHandles);

  return {
    ...reshapeArtist(artistRow),
    bio: artistRow.bio,
    publications,
    products,
  };
}

export async function getPublication(
  slug: string,
): Promise<PublicationDetail | undefined> {
  "use cache";
  cacheTag(ARCHIVE_TAGS.artists, ARCHIVE_TAGS.publications);
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

  const [artistsResult, productsResult] = await Promise.all([
    supabase
      .from("artist_publications")
      .select(
        "sort_order, artists(id, slug, name, created_at, image_path, image_alt)",
      )
      .eq("publication_id", publicationRow.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("publication_products")
      .select("shopify_product_id")
      .eq("publication_id", publicationRow.id),
  ]);

  if (artistsResult.error) {
    console.error(
      `Failed to fetch artists for publication '${slug}':`,
      artistsResult.error.message,
    );
  }

  if (productsResult.error) {
    console.error(
      `Failed to fetch products for publication '${slug}':`,
      productsResult.error.message,
    );
  }

  const artists: ArtistWithSortOrder[] = (artistsResult.data ?? [])
    .filter((row) => row.artists)
    .map((row) => ({
      ...reshapeArtist(row.artists as unknown as ArtistRow),
      sortOrder: row.sort_order,
    }));

  const productHandles = (productsResult.data ?? []).map(
    (row) => row.shopify_product_id,
  );
  const products = await resolveProducts(productHandles);

  return {
    ...reshapePublication(publicationRow),
    description: publicationRow.description,
    artists,
    products,
  };
}
