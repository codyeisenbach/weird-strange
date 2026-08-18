"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

// Shared rich-text body editor for all archive editors (artist bio,
// publication description, artwork description) — mirrors WikiEditable's
// extraFields pattern of sharing one component across callers rather than
// forking per-field. Tiptap has no real form <input>/<textarea> of its own,
// so this mirrors editor state into a hidden input on every change; every
// caller's Server Action already reads the body field via
// `formData.get(name)`, so this keeps that contract unchanged.
//
// The output HTML is untrusted until it passes through
// sanitizeArticleHtml() server-side (lib/archive/sanitize.ts) — this
// component restricting available formatting is a UX convenience, not the
// security boundary.
export function RichTextEditor({
  name,
  label,
  initialValue,
  placeholder,
}: {
  name: string;
  label: string;
  initialValue: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initialValue);

  const editor = useEditor({
    // Required under React 19/Next SSR — without this, Tiptap renders
    // content during SSR and again on the client, causing a hydration
    // mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: initialValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-32 px-3 py-2 font-serif text-[17px] leading-7 outline-none [&_a]:text-blue-700 [&_a]:hover:underline [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-normal [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-normal [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc",
      },
    },
  });

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <div className="border border-ws-border bg-transparent focus-within:border-ws-charcoal">
        {editor ? (
          <div className="flex flex-wrap gap-1 border-b border-ws-border p-1">
            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              label="Bold"
            >
              B
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              label="Italic"
            >
              I
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              label="Strikethrough"
            >
              S
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              label="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              label="Heading 3"
            >
              H3
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              label="Bullet list"
            >
              • List
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              label="Numbered list"
            >
              1. List
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("link")}
              onClick={setLink}
              label="Link"
            >
              Link
            </ToolbarButton>
          </div>
        ) : null}
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="[&_.tiptap]:min-h-32"
        />
      </div>
      <input type="hidden" name={name} value={html} />
    </label>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`px-2 py-1 text-xs ${
        active
          ? "bg-ws-charcoal text-white"
          : "bg-transparent text-ws-charcoal hover:bg-ws-border"
      }`}
    >
      {children}
    </button>
  );
}
