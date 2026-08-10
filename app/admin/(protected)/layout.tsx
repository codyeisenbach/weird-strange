import { requireAdmin } from "lib/admin/auth";
import type { Metadata } from "next";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: middleware already gates /admin, but every server
  // render re-checks so this layout is safe even if middleware config ever
  // drifts (e.g. matcher changes).
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen text-ws-charcoal">
      <header className="flex items-center justify-between border-b border-ws-border px-6 py-4">
        <span className="text-sm font-semibold">Weird Strange Admin</span>
        <div className="flex items-center gap-4 text-sm text-ws-text-muted">
          <span>{admin.email}</span>
          <form action={signOut}>
            <button type="submit" className="hover:opacity-70">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
