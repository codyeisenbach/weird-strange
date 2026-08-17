"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { EditFormState } from "app/archive/actions";
import type { Artist, Publication } from "lib/archive/types";
import { ArticleBody } from "./wiki-article";

export type ArtworkEditableFields = {
  title: string;
  artistId: string;
  publicationId: string;
  placement: string;
  description: string;
};

// Wikipedia-style edit-in-place for an artwork, mirroring WikiEditable's
// layout/state pattern exactly (see that file's comment for why the layout
// is duplicated here rather than composed via a render prop — same
// Server/Client Component boundary reasoning applies). Artwork editing
// needs artist/publication selects and a placement field alongside
// title/description, which WikiEditable's fixed title+body shape can't
// express, so this is a dedicated sibling rather than a WikiEditable
// extension.
export function WikiEditableArtwork({
  subtitle,
  infobox,
  children,
  artists,
  publications,
  initial,
  action,
}: {
  subtitle?: string;
  infobox: ReactNode;
  children?: ReactNode;
  artists: Artist[];
  publications: Publication[];
  initial: ArtworkEditableFields;
  action: (state: EditFormState, formData: FormData) => Promise<EditFormState>;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(initial);
  const [state, formAction, pending] = useActionState<EditFormState, FormData>(
    action,
    {},
  );

  const pendingSubmit = useRef<ArtworkEditableFields | null>(null);

  useEffect(() => {
    if (pending || !pendingSubmit.current) return;

    if (!state?.error) {
      setCurrent(pendingSubmit.current);
      setEditing(false);
    }
    pendingSubmit.current = null;
  }, [pending, state]);

  const submit = (formData: FormData) => {
    pendingSubmit.current = {
      title: String(formData.get("title") ?? ""),
      artistId: String(formData.get("artistId") ?? ""),
      publicationId: String(formData.get("publicationId") ?? ""),
      placement: String(formData.get("placement") ?? ""),
      description: String(formData.get("description") ?? ""),
    };
    formAction(formData);
  };

  return (
    <article className="mx-auto max-w-(--breakpoint-xl) px-4 py-12 font-serif text-ws-charcoal">
      {editing ? (
        <input
          type="text"
          name="title"
          form="wiki-editable-artwork-form"
          defaultValue={current.title}
          required
          aria-label="Title"
          className="w-full border border-ws-border bg-transparent px-2 py-1 text-4xl leading-tight font-normal outline-none focus:border-ws-charcoal"
        />
      ) : (
        <h1 className="text-4xl leading-tight font-normal">{current.title}</h1>
      )}
      {subtitle ? (
        <p className="mt-1 font-sans text-sm text-neutral-500">{subtitle}</p>
      ) : null}
      <hr className="mt-2 mb-6 border-neutral-300 dark:border-neutral-700" />

      {infobox}

      {editing ? (
        <form
          id="wiki-editable-artwork-form"
          action={submit}
          className="flex flex-col gap-4 font-sans"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              Artist
              <select
                name="artistId"
                required
                defaultValue={current.artistId}
                className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
              >
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Publication
              <select
                name="publicationId"
                defaultValue={current.publicationId}
                className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
              >
                <option value="">None</option>
                {publications.map((publication) => (
                  <option key={publication.id} value={publication.id}>
                    {publication.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Placement
              <input
                type="text"
                name="placement"
                defaultValue={current.placement}
                placeholder="front_cover, back_cover, interior…"
                className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea
              name="description"
              defaultValue={current.description}
              rows={10}
              className="border border-ws-border bg-transparent px-3 py-2 font-serif text-[17px] leading-7 outline-none focus:border-ws-charcoal"
            />
          </label>
          {state?.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="border border-ws-border px-4 py-2 text-sm hover:opacity-70 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="px-4 py-2 text-sm text-ws-text-muted hover:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mb-2 font-sans text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            Edit
          </button>
          <ArticleBody text={current.description} />
        </>
      )}

      <div className="clear-both font-sans">{children}</div>
    </article>
  );
}
