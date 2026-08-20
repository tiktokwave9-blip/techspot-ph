import {
  createSession,
  verifySession,
  sessionCookie,
  clearSessionCookie
} from "../_auth.js";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

export async function onRequestGet(context) {
  const authenticated = await verifySession(
    context.request,
    context.env.SESSION_SECRET
  );

  return json(
    { authenticated },
    200,
    { "Cache-Control": "no-store" }
  );
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const password = String(body.password || "");

    if (!context.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD is missing");

      return json(
        { error: "Admin authentication is not configured" },
        500
      );
    }

    if (!context.env.SESSION_SECRET) {
      console.error("SESSION_SECRET is missing");

      return json(
        { error: "Session authentication is not configured" },
        500
      );
    }

    if (!password) {
      return json(
        { error: "Password is required" },
        400
      );
    }

    if (password !== context.env.ADMIN_PASSWORD) {
      return json(
        { error: "Invalid password" },
        401
      );
    }

    const token = await createSession(
      context.env.SESSION_SECRET
    );

    return json(
      { success: true },
      200,
      {
        "Set-Cookie": sessionCookie(token),
        "Cache-Control": "no-store"
      }
    );

  } catch (error) {
    console.error("Admin login error:", error);

    return json(
      { error: "Unable to log in" },
      500
    );
  }
}

export async function onRequestDelete(context) {
  return json(
    { success: true },
    200,
    {
      "Set-Cookie": clearSessionCookie(),
      "Cache-Control": "no-store"
    }
  );
}
