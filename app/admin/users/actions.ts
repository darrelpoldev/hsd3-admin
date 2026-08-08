"use server";

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const GENERATED_PASSWORD_BYTES = 12;

const newUserSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters."),
  role: z.enum(["admin", "staff"]),
});

export type NewUserState = {
  error: string | null;
  createdUsername: string | null;
  generatedPassword: string | null;
};

export type DeleteUserState = { error: string | null };

function generatePassword(): string {
  const bytes = crypto.getRandomValues(
    new Uint8Array(GENERATED_PASSWORD_BYTES),
  );

  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "")
    .replaceAll("/", "")
    .replace(/=+$/, "");
}

export async function createUser(
  _previous: NewUserState,
  formData: FormData,
): Promise<NewUserState> {
  await requireAdmin();

  const parsed = newUserSchema.safeParse({
    username: formData.get("username"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      createdUsername: null,
      generatedPassword: null,
    };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, parsed.data.username));

  if (existing) {
    return {
      error: "That username is already taken.",
      createdUsername: null,
      generatedPassword: null,
    };
  }

  const password = generatePassword();

  await db.insert(users).values({
    username: parsed.data.username,
    passwordHash: await hash(password),
    role: parsed.data.role,
  });

  revalidatePath("/admin/users");

  return {
    error: null,
    createdUsername: parsed.data.username,
    generatedPassword: password,
  };
}

export async function deleteUser(
  _previous: DeleteUserState,
  formData: FormData,
): Promise<DeleteUserState> {
  const session = await requireAdmin();

  const userId = z.uuid().safeParse(formData.get("userId"));

  if (!userId.success) {
    return { error: "Unknown user." };
  }

  if (userId.data === session.userId) {
    return { error: "You cannot remove your own account." };
  }

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  const isLastAdmin =
    admins.length <= 1 && admins.some((admin) => admin.id === userId.data);

  if (isLastAdmin) {
    return { error: "At least one admin must remain." };
  }

  await db.delete(users).where(eq(users.id, userId.data));

  revalidatePath("/admin/users");

  return { error: null };
}
