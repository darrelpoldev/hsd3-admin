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

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$HaOePefvO66JFinu5DJ55w$tpNRf07xRIhYipgRiqAMdRt/ZO96RiwZ2pR40W7eCNY";

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
    await verify(DUMMY_PASSWORD_HASH, credentials.data.password);

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
