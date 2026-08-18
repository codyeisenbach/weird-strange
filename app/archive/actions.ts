"use server";

import { requireAdmin } from "lib/admin/auth";
import {
  bulkCreateArtworksForPublications,
  createArtist,
  createArtwork,
  createPublication,
  getArtworkImageUploadUrl,
  linkArtworkProduct,
  unlinkArtworkProduct,
  updateArtist,
  updateArtwork,
  updatePublication,
  uploadArtworkImage,
} from "lib/archive";
import { redirect } from "next/navigation";

export type EditFormState = { error?: string };

export async function saveArtistEdit(
  id: string,
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  // Every archive mutation re-verifies admin status server-side — the
  // "Edit" UI only being rendered for admins is not itself a security
  // boundary, since a form POST can be replayed by anyone.
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  return updateArtist(id, { name, bio });
}

export async function savePublicationEdit(
  id: string,
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const issueDate = String(formData.get("issueDate") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  return updatePublication(id, { title, description, issueDate });
}

export async function createArtistEntry(
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const { slug, error } = await createArtist(name, bio);
  if (error || !slug) {
    return { error: error ?? "Failed to create entry." };
  }

  redirect(`/archive/artists/${slug}`);
}

export async function createPublicationEntry(
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  const { slug, error } = await createPublication(title, description);
  if (error || !slug) {
    return { error: error ?? "Failed to create entry." };
  }

  redirect(`/archive/publications/${slug}`);
}

export async function saveArtworkEdit(
  id: string,
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const artistId = String(formData.get("artistId") ?? "").trim();
  const publicationId = String(formData.get("publicationId") ?? "").trim();
  const placement = String(formData.get("placement") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  if (!artistId) {
    return { error: "Artist is required." };
  }

  return updateArtwork(id, {
    title,
    artistId,
    publicationId: publicationId || null,
    placement: placement || null,
    description,
  });
}

export async function createArtworkEntry(
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const artistId = String(formData.get("artistId") ?? "").trim();
  const publicationId = String(formData.get("publicationId") ?? "").trim();
  const placement = String(formData.get("placement") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const productHandles = formData
    .getAll("productHandles")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const imageStagingKey = String(formData.get("stagingKey") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  if (!artistId) {
    return { error: "Artist is required." };
  }

  const { slug, error } = await createArtwork(
    title,
    artistId,
    publicationId || null,
    placement || null,
    description,
    productHandles,
    imageStagingKey || null,
  );
  if (error || !slug) {
    return { error: error ?? "Failed to create entry." };
  }

  redirect(`/archive/artworks/${slug}`);
}

// Step 1 of the direct-to-R2 upload flow — called before any file bytes
// move, returns a presigned PUT URL the browser uploads straight to R2
// with (see components/archive/artwork-image-upload.tsx and
// new-artwork-form.tsx). Bypasses Vercel's serverless function body-size
// ceiling entirely, which routing raw files through a Server Action hit in
// production regardless of any bodySizeLimit config (a hard platform
// limit that config can't raise).
export async function getArtworkImageUploadUrlAction(
  contentType: string,
): Promise<{ uploadUrl?: string; stagingKey?: string; error?: string }> {
  await requireAdmin();
  return getArtworkImageUploadUrl(contentType);
}

// Step 2 — called once the browser has already PUT the file directly to
// R2 at `stagingKey`. No file bytes in this call, just a small string, so
// it's never at risk of hitting the same body-size ceiling.
export async function uploadArtworkImageAction(
  artworkId: string,
  artworkSlug: string,
  stagingKey: string,
): Promise<{ imagePath?: string; error?: string }> {
  await requireAdmin();

  if (!stagingKey) {
    return { error: "No image uploaded." };
  }

  return uploadArtworkImage(artworkId, artworkSlug, stagingKey);
}

export async function linkArtworkProductAction(
  artworkId: string,
  shopifyProductHandle: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  return linkArtworkProduct(artworkId, shopifyProductHandle);
}

export async function unlinkArtworkProductAction(
  artworkId: string,
  shopifyProductHandle: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  return unlinkArtworkProduct(artworkId, shopifyProductHandle);
}

export async function bulkLinkArtistPublicationsAction(
  artistId: string,
  artistName: string,
  publicationIds: string[],
): Promise<{ error?: string }> {
  await requireAdmin();
  return bulkCreateArtworksForPublications(
    artistId,
    artistName,
    publicationIds,
  );
}
