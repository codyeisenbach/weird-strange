import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-20 text-ws-charcoal">
      <h1 className="mb-2 text-2xl font-bold">Admin sign in</h1>
      <p className="mb-8 text-sm text-ws-text-muted">
        Enter your email and we&apos;ll send you a sign-in link.
      </p>
      <LoginForm />
    </div>
  );
}
