import { describe, expect, it } from "vitest";

import { signSession, verifySession } from "./auth";

const SECRET = "test-secret-that-is-long-enough-for-hmac";
const NOW = new Date("2026-08-08T12:00:00Z");

const payload = {
  userId: "8f1c7b60-0c9a-4a0e-9a1e-2f2f9a3c1111",
  role: "admin" as const,
  expiresAt: new Date("2026-08-09T12:00:00Z").getTime(),
};

describe("session tokens", () => {
  it("round-trips a payload it signed", async () => {
    const token = await signSession(payload, SECRET);

    expect(await verifySession(token, SECRET, NOW)).toEqual(payload);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(payload, "some-other-secret");

    expect(await verifySession(token, SECRET, NOW)).toBeNull();
  });

  it("rejects a staff token edited to claim the admin role", async () => {
    const staffToken = await signSession(
      { ...payload, role: "staff" },
      SECRET,
    );
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, role: "admin" }),
    ).toString("base64url");

    expect(
      await verifySession(
        `${forgedBody}.${staffToken.split(".")[1]}`,
        SECRET,
        NOW,
      ),
    ).toBeNull();
  });

  it("rejects a token whose expiry was pushed into the future", async () => {
    const token = await signSession(payload, SECRET);
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, expiresAt: Date.parse("2099-01-01") }),
    ).toString("base64url");

    expect(
      await verifySession(
        `${forgedBody}.${token.split(".")[1]}`,
        SECRET,
        new Date("2026-08-10T12:00:00Z"),
      ),
    ).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession(payload, SECRET);

    expect(
      await verifySession(token, SECRET, new Date("2026-08-10T12:00:00Z")),
    ).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await verifySession("not-a-token", SECRET, NOW)).toBeNull();
  });

  it("rejects an empty token", async () => {
    expect(await verifySession("", SECRET, NOW)).toBeNull();
  });
});
