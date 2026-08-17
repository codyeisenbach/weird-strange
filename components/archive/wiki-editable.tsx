"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { EditFormState } from "app/archive/actions";
import { ArticleBody } from "./wiki-article";

// Wikipedia-style edit-in-place for an archive entry's title + body text.
// This duplicates WikiArticle's header/body layout (h1, subtitle, hr, body,
// children) rather than composing WikiArticle via a render prop, because
// this is a Client Component: a Server Component parent can pass it
// already-rendered JSX (infobox, children — both serializable), but not a
// function that builds JSX on demand ("Functions are not valid as a child
// of Client Components"). So the layout lives here once, directly.
//
export type WikiEditableExtraField = {
  name: string;
  label: string;
  initialValue: string;
  placeholder?: string;
};

// Only rendered for admins by the caller, but the save action re-checks
// admin status server-side regardless, since a render-time gate isn't a
// security boundary on its own.
export function WikiEditable({
  subtitle,
  infobox,
  children,
  titleFieldName,
  titleLabel,
  bodyFieldName,
  bodyLabel,
  initialTitle,
  initialBody,
  extraFields,
  action,
}: {
  subtitle?: string;
  infobox: ReactNode;
  children?: ReactNode;
  titleFieldName: string;
  titleLabel: string;
  bodyFieldName: string;
  bodyLabel: string;
  initialTitle: string;
  initialBody: string;
  // Optional extra text inputs rendered above the body textarea (e.g. a
  // publication's issue date) — artists don't need these, so this stays
  // undefined/omitted for that caller and WikiEditable renders exactly as
  // it did before this was added.
  extraFields?: WikiEditableExtraField[];
  action: (state: EditFormState, formData: FormData) => Promise<EditFormState>;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState({
    title: initialTitle,
    body: initialBody,
    extraFields: Object.fromEntries(
      (extraFields ?? []).map((field) => [field.name, field.initialValue]),
    ) as Record<string, string>,
  });
  const [state, formAction, pending] = useActionState<EditFormState, FormData>(
    action,
    {},
  );

  // useActionState's dispatcher doesn't return the new state — it lands on
  // the next render via `state`. Track the values from the in-flight submit
  // so that once it resolves without an error, they can be committed and
  // the form closed.
  const pendingSubmit = useRef<typeof current | null>(null);

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
      title: String(formData.get(titleFieldName) ?? ""),
      body: String(formData.get(bodyFieldName) ?? ""),
      extraFields: Object.fromEntries(
        (extraFields ?? []).map((field) => [
          field.name,
          String(formData.get(field.name) ?? ""),
        ]),
      ),
    };
    formAction(formData);
  };

  return (
    <article className="mx-auto max-w-(--breakpoint-xl) px-4 py-12 font-serif text-ws-charcoal">
      {editing ? (
        <input
          type="text"
          name={titleFieldName}
          form="wiki-editable-form"
          defaultValue={current.title}
          required
          aria-label={titleLabel}
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
          id="wiki-editable-form"
          action={submit}
          className="flex flex-col gap-4 font-sans"
        >
          {(extraFields ?? []).map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              {field.label}
              <input
                type="text"
                name={field.name}
                defaultValue={current.extraFields[field.name]}
                placeholder={field.placeholder}
                className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
              />
            </label>
          ))}
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
      ) : (
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
      )}

      <div className="clear-both font-sans">{children}</div>
    </article>
  );
}
