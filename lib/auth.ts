export type SessionPayload = {
  userId: string;
  role: "admin" | "staff";
  expiresAt: number;
};

const SIGNATURE_ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    SIGNATURE_ALGORITHM,
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign(
    SIGNATURE_ALGORITHM,
    key,
    new TextEncoder().encode(body),
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(
  token: string,
  secret: string,
  now: Date,
): Promise<SessionPayload | null> {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const key = await importSigningKey(secret);
  const isAuthentic = await crypto.subtle.verify(
    SIGNATURE_ALGORITHM,
    key,
    fromBase64Url(signature),
    new TextEncoder().encode(body),
  );

  if (!isAuthentic) {
    return null;
  }

  const payload = JSON.parse(
    new TextDecoder().decode(fromBase64Url(body)),
  ) as SessionPayload;

  if (payload.expiresAt <= now.getTime()) {
    return null;
  }

  return payload;
}
