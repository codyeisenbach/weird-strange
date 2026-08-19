import { getArtists, getArtworks, getPublications } from "lib/archive";
import { getCollections, getPages, getProducts } from "lib/shopify";
import { baseUrl, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const routesMap = ["", "/archive/artists", "/archive/publications", "/archive/artworks"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString(),
    }),
  );

  const collectionsPromise = getCollections().then((collections) =>
    collections.map((collection) => ({
      url: `${baseUrl}${collection.path}`,
      lastModified: collection.updatedAt,
    })),
  );

  // The Storefront API only ever returns active/published products for a
  // public storefront token — draft and archived products aren't queryable
  // through it, so no extra status filter is needed or possible here.
  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/product/${product.handle}`,
      lastModified: product.updatedAt,
    })),
  );

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: page.updatedAt,
    })),
  );

  // None of the archive tables have a draft/status column (see CLAUDE.md) —
  // every row is public by construction, so all rows returned here belong
  // in the sitemap with no additional filtering.
  const artistsPromise = getArtists().then((artists) =>
    artists.map((artist) => ({
      url: `${baseUrl}/archive/artists/${artist.slug}`,
      lastModified: artist.createdAt,
    })),
  );

  const publicationsPromise = getPublications().then((publications) =>
    publications.map((publication) => ({
      url: `${baseUrl}/archive/publications/${publication.slug}`,
      lastModified: publication.createdAt,
    })),
  );

  const artworksPromise = getArtworks().then((artworks) =>
    artworks.map((artwork) => ({
      url: `${baseUrl}/archive/artworks/${artwork.slug}`,
      lastModified: artwork.createdAt,
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([
        collectionsPromise,
        productsPromise,
        pagesPromise,
        artistsPromise,
        publicationsPromise,
        artworksPromise,
      ])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...routesMap, ...fetchedRoutes];
}
