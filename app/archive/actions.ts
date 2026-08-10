"use server";

import { requireAdmin } from "lib/admin/auth";
import {
  createArtist,
  createPublication,
  updateArtist,
  updatePublication,
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

  if (!title) {
    return { error: "Title is required." };
  }

  return updatePublication(id, { title, description });
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
