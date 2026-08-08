import { NextResponse, type NextRequest } from "next/server";

import { verifySession } from "./lib/auth";
import { SESSION_COOKIE_NAME } from "./lib/session-cookie";

export async function middleware(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const session =
    secret && token ? await verifySession(token, secret, new Date()) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
