"use server";

import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/session";

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginState = { error: string | null };

const REJECTION_MESSAGE = "Incorrect username or password.";

export async function logIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return { error: "Enter both a username and a password." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, credentials.data.username))
    .limit(1);

  if (!user) {
    return { error: REJECTION_MESSAGE };
  }

  const isCorrectPassword = await verify(
    user.passwordHash,
    credentials.data.password,
  );

  if (!isCorrectPassword) {
    return { error: REJECTION_MESSAGE };
  }

  await createSession({ id: user.id, role: user.role });

  redirect("/admin");
}

export async function logOut(): Promise<void> {
  await destroySession();

  redirect("/login");
}
