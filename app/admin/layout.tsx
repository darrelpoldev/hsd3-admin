import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/app/brand";
import { logOut } from "@/app/login/actions";
import { ThemeToggle } from "@/app/theme-toggle";
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
    <div className="min-h-screen bg-raised">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Wordmark compact />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logOut}>
              <button type="submit" className="text-sm text-muted underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-3xl gap-4 overflow-x-auto px-4 pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-ink hover:underline"
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
