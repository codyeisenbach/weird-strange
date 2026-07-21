import type { Product } from "lib/shopify/types";

// Mirrors the Supabase `public` schema for the /archive feature.

export type ArchiveImage = {
  imagePath: string | null;
  imageAlt: string | null;
};

export type Artist = ArchiveImage & {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
};

export type Publication = ArchiveImage & {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
};

// An artist as it appears in the context of one of their publications
// (carries the join row's sort_order).
export type ArtistWithSortOrder = Artist & {
  sortOrder: number;
};

// A publication as it appears in the context of one of its artists
// (carries the join row's sort_order).
export type PublicationWithSortOrder = Publication & {
  sortOrder: number;
};

export type ArtistDetail = Artist & {
  bio: string | null;
  publications: PublicationWithSortOrder[];
  products: Product[];
};

export type PublicationDetail = Publication & {
  description: string | null;
  artists: ArtistWithSortOrder[];
  products: Product[];
};
