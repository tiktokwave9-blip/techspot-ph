function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const productId = body.product_id
      ? Number(body.product_id)
      : null;

    if (!name || !message) {
      return json(
        {
          error: "Name and message are required"
        },
        400
      );
    }

    if (name.length > 100 || message.length > 2000) {
      return json(
        {
          error: "Message is too long"
        },
        400
      );
    }

    await context.env.TECHSPOT_DB
      .prepare(`
        INSERT INTO messages
        (
          name,
          email,
          message,
          product_id,
          status
        )
        VALUES (?, ?, ?, ?, 'unread')
      `)
      .bind(
        name,
        email || null,
        message,
        Number.isFinite(productId)
          ? productId
          : null
      )
      .run();

    return json({
      success: true
    });

  } catch (error) {
    console.error("Message API error:", error);

    return json(
      {
        error: "Unable to send message"
      },
      500
    );
  }
}
