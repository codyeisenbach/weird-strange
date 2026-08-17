"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

// Admin-only image upload for an existing artwork. Unlike the create
// form's plain <input type="file">, this one uploads immediately on
// selection (via a Server Action, same useTransition pattern as
// LinkedProductsEditor) since — unlike creation — there's already an
// artwork id/slug to upload against, so there's no reason to wait for a
// separate form submit. The server-rendered infobox (a sibling, passed
// down from the page as a ReactNode — see WikiEditableArtwork) can't be
// updated by passing state back up through this component, so a successful
// upload calls router.refresh() to re-fetch the page's server data (now
// pointing at the new image via the cache tag the upload already busts)
// rather than trying to thread the new URL through a prop chain.
export function ArtworkImageUpload({
  artworkId,
  artworkSlug,
  currentImagePath,
  currentImageAlt,
  uploadAction,
}: {
  artworkId: string;
  artworkSlug: string;
  currentImagePath: string | null;
  currentImageAlt: string | null;
  uploadAction: (
    artworkId: string,
    artworkSlug: string,
    formData: FormData,
  ) => Promise<{ imagePath?: string; error?: string }>;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentImagePath);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("image", file);

    startTransition(async () => {
      const result = await uploadAction(artworkId, artworkSlug, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.imagePath) {
        setPreview(result.imagePath);
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      Image
      {preview ? (
        <div className="relative aspect-square w-32 overflow-hidden border border-ws-border bg-neutral-50 dark:bg-neutral-900">
          <Image
            src={preview}
            alt={currentImageAlt || "Artwork image"}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={pending}
        onChange={handleChange}
        className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none file:mr-3 file:border-0 file:bg-ws-border file:px-3 file:py-1 file:text-sm focus:border-ws-charcoal disabled:opacity-50"
      />
      {pending ? (
        <p className="text-xs text-ws-text-muted">Uploading…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
