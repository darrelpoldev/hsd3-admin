import { asc } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { DeleteUserForm } from "./delete-user-form";
import { NewUserForm } from "./new-user-form";

export default async function UsersPage() {
  const session = await requireAdmin();

  const allUsers = await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .orderBy(asc(users.username));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted">
          Passwords are generated once and never shown again.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-base font-medium">Add a user</h2>
        <NewUserForm />
      </section>

      <section className="flex flex-col gap-3">
        {allUsers.map((user) => (
          <article
            key={user.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <div>
              <p className="text-base">{user.username}</p>
              <p className="text-sm text-muted">{user.role}</p>
            </div>

            {user.id === session.userId ? (
              <span className="text-sm text-muted">You</span>
            ) : (
              <DeleteUserForm userId={user.id} />
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
