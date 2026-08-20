const COOKIE_NAME = "techspot_admin";
const SESSION_TTL = 60 * 60 * 8;

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  const bytes = new Uint8Array(signature);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createSession(secret) {
  const expires =
    Math.floor(Date.now() / 1000) + SESSION_TTL;

  const payload = `admin.${expires}`;

  const signature =
    await sign(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifySession(request, secret) {

  if (!secret) {
    return false;
  }

  const cookieHeader =
    request.headers.get("Cookie") || "";

  const match =
    cookieHeader.match(
      /(?:^|;\s*)techspot_admin=([^;]+)/
    );

  if (!match) {
    return false;
  }

  const parts =
    match[1].split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [type, expiresString, signature] =
    parts;

  if (type !== "admin") {
    return false;
  }

  const expires =
    Number(expiresString);

  if (
    !Number.isFinite(expires) ||
    expires < Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const payload =
    `${type}.${expires}`;

  const expected =
    await sign(payload, secret);

  return signature === expected;
}

export function sessionCookie(token) {

  return [
    `techspot_admin=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL}`
  ].join("; ");
}

export function clearSessionCookie() {

  return [
    "techspot_admin=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}
