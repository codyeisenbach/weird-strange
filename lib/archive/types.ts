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

export type Artwork = ArchiveImage & {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  placement: string | null;
};

export type ArtistDetail = Artist & {
  bio: string | null;
  // Derived from this artist's artworks (distinct linked publications,
  // ordered by each publication's earliest linked artwork) rather than a
  // manually curated join row — see lib/archive/index.ts.
  publications: Publication[];
  products: Product[];
  artworks: Artwork[];
};

export type PublicationDetail = Publication & {
  description: string | null;
  // Derived the same way, from the other direction.
  artists: Artist[];
  products: Product[];
  artworks: Artwork[];
};

export type ArtworkDetail = Artwork & {
  description: string | null;
  artist: Artist;
  publication: Publication | null;
  products: Product[];
};
