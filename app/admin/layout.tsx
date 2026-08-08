import Link from "next/link";
import type { ReactNode } from "react";

import { logOut } from "@/app/login/actions";
import { requireSession } from "@/lib/session";

const STAFF_LINKS = [{ href: "/admin", label: "Schedule" }];

const ADMIN_LINKS = [
  { href: "/admin/services", label: "Services" },
  { href: "/admin/hours", label: "Hours" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  const links =
    session.role === "admin" ? [...STAFF_LINKS, ...ADMIN_LINKS] : STAFF_LINKS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Shop admin</span>
          <form action={logOut}>
            <button type="submit" className="text-sm text-slate-600 underline">
              Sign out
            </button>
          </form>
        </div>
        <nav className="mx-auto flex w-full max-w-3xl gap-4 overflow-x-auto px-4 pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-slate-700 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
