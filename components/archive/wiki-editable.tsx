"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EditFormState } from "app/archive/actions";
import { ArticleBody } from "./wiki-article";

export type WikiEditableRender = {
  title: React.ReactNode;
  body: React.ReactNode;
};

// Wikipedia-style edit-in-place for an archive entry's title + body text.
// Renders as a render-prop so the caller can place the title half inside
// <h1> (via <WikiArticle title={...}>) and the body half in the article
// body slot, while both stay driven by one shared edit/save state and one
// <form> — title and body save together, matching real Wikipedia's
// edit-the-whole-article model (there's no separate rename action here).
//
// Only rendered for admins by the caller, but the save action re-checks
// admin status server-side regardless, since a render-time gate isn't a
// security boundary on its own.
export function WikiEditable({
  titleFieldName,
  titleLabel,
  bodyFieldName,
  bodyLabel,
  initialTitle,
  initialBody,
  action,
  children,
}: {
  titleFieldName: string;
  titleLabel: string;
  bodyFieldName: string;
  bodyLabel: string;
  initialTitle: string;
  initialBody: string;
  action: (state: EditFormState, formData: FormData) => Promise<EditFormState>;
  children: (render: WikiEditableRender) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState({
    title: initialTitle,
    body: initialBody,
  });
  const [state, formAction, pending] = useActionState<EditFormState, FormData>(
    action,
    {},
  );

  // useActionState's dispatcher doesn't return the new state — it lands on
  // the next render via `state`. Track the values from the in-flight submit
  // so that once it resolves without an error, they can be committed and
  // the form closed.
  const pendingSubmit = useRef<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (pending || !pendingSubmit.current) return;

    if (!state?.error) {
      setCurrent(pendingSubmit.current);
      setEditing(false);
    }
    pendingSubmit.current = null;
  }, [pending, state]);

  if (!editing) {
    return children({
      title: current.title,
      body: (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mb-2 font-sans text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            Edit
          </button>
          <ArticleBody text={current.body} />
        </>
      ),
    });
  }

  const formId = "wiki-editable-form";

  const submit = (formData: FormData) => {
    pendingSubmit.current = {
      title: String(formData.get(titleFieldName) ?? ""),
      body: String(formData.get(bodyFieldName) ?? ""),
    };
    formAction(formData);
  };

  return children({
    title: (
      <input
        form={formId}
        type="text"
        name={titleFieldName}
        defaultValue={current.title}
        required
        aria-label={titleLabel}
        className="w-full border border-ws-border bg-transparent px-2 py-1 text-4xl leading-tight font-normal outline-none focus:border-ws-charcoal"
      />
    ),
    body: (
      <form
        id={formId}
        action={submit}
        className="flex flex-col gap-4 font-sans"
      >
        <label className="flex flex-col gap-1 text-sm">
          {bodyLabel}
          <textarea
            name={bodyFieldName}
            defaultValue={current.body}
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
    ),
  });
}
