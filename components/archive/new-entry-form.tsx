"use client";

import { useActionState, useState } from "react";
import type { EditFormState } from "app/archive/actions";

// Admin-only "+ New" affordance for the archive list pages. Toggles between
// a button and an inline create form (name/title + bio/description). On
// success the action redirects to the new entry's page, so there's no local
// success state to handle here — only the error path stays on this page.
export function NewEntryForm({
  label,
  titleFieldName,
  titleLabel,
  bodyFieldName,
  bodyLabel,
  action,
}: {
  label: string;
  titleFieldName: string;
  titleLabel: string;
  bodyFieldName: string;
  bodyLabel: string;
  action: (state: EditFormState, formData: FormData) => Promise<EditFormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<EditFormState, FormData>(
    action,
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-ws-border px-4 py-2 text-sm hover:opacity-70"
      >
        + {label}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex max-w-3xl flex-col gap-4 border border-ws-border p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        {titleLabel}
        <input
          type="text"
          name={titleFieldName}
          required
          autoFocus
          className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {bodyLabel}
        <textarea
          name={bodyFieldName}
          rows={6}
          className="border border-ws-border bg-transparent px-3 py-2 font-serif text-[17px] leading-7 outline-none focus:border-ws-charcoal"
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-ws-border px-4 py-2 text-sm hover:opacity-70 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="px-4 py-2 text-sm text-ws-text-muted hover:opacity-70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
