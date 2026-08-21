"use client";

import { useTransition } from "react";

// Overlay delete control for a listing-page tile. ArchiveTile is itself the
// whole <Link> (image + title, one anchor) — this renders as a sibling to
// that Link inside a `relative` <li>, not nested inside it, since a nested
// interactive element inside an anchor is invalid HTML. Positioned
// absolutely on top instead.
//
// Unlike this codebase's existing "Unlink"/"Remove" buttons (immediate, no
// confirmation), a hard delete here can have much higher blast radius —
// deleting an artist cascades to permanently delete every one of their
// artworks at the DB level — so this is the one place in the archive editor
// that gates on a confirmation prompt before calling the action. A plain
// window.confirm() rather than a new modal component: this repo has no
// existing small confirm-dialog to reuse, and the destructive, rare,
// admin-only nature of this action doesn't justify building one.
export function DeleteTileButton({
  id,
  confirmMessage,
  deleteAction,
  onDeleted,
}: {
  id: string;
  confirmMessage: string;
  deleteAction: (id: string) => Promise<{ error?: string }>;
  onDeleted: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      onDeleted(id);
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-label="Delete"
      className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-red-600"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
