"use client";

import { useActionState, useState } from "react";
import { getSupabaseBrowserClient } from "lib/supabase/client";
import { sendMagicLink } from "./actions";

const initialState: string | undefined = undefined;

export function LoginForm() {
  const [message, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );
  const [googlePending, setGooglePending] = useState(false);

  const signInWithGoogle = async () => {
    setGooglePending(true);
    const supabase = getSupabaseBrowserClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl.replace(/\/$/, "")}/admin/auth/callback?next=/admin`,
      },
    });

    // On success the browser is redirected to Google, so this only runs on
    // failure (e.g. provider not configured in the Supabase dashboard).
    if (error) {
      console.error("Failed to start Google sign-in:", error.message);
      setGooglePending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={googlePending}
        className="border border-ws-border px-4 py-2 text-sm hover:opacity-70 disabled:opacity-50"
      >
        {googlePending ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs text-ws-text-muted">
        <span className="h-px flex-1 bg-ws-border" />
        or
        <span className="h-px flex-1 bg-ws-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="border border-ws-border bg-transparent px-3 py-2 text-base outline-none focus:border-ws-charcoal"
            placeholder="you@weirdstrange.com"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="border border-ws-border px-4 py-2 text-sm hover:opacity-70 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send sign-in link"}
        </button>
        {message ? (
          <p role="status" className="text-sm text-ws-text-muted">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
