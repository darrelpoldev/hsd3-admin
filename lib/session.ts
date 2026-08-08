import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signSession, verifySession, type SessionPayload } from "./auth";
import { SESSION_COOKIE_NAME } from "./session-cookie";

const SESSION_DURATION_HOURS = 12;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  return secret;
}

export async function createSession(user: {
  id: string;
  role: "admin" | "staff";
}): Promise<void> {
  const expiresAt =
    Date.now() + SESSION_DURATION_HOURS * MILLISECONDS_PER_HOUR;

  const token = await signSession(
    { userId: user.id, role: user.role, expiresAt },
    sessionSecret(),
  );

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token, sessionSecret(), new Date());
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/admin");
  }

  return session;
}
