export async function onRequestGet(context) {
  try {
    const { results } = await context.env.TECHSPOT_DB
      .prepare(`
        SELECT
          id,
          name,
          price,
          description,
          image_url,
          rating,
          rating_count,
          stock,
          created_at,
          updated_at
        FROM products
        ORDER BY id DESC
      `)
      .all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=60"
      }
    });

  } catch (error) {
    // Do not expose database/error details publicly.
    console.error("Products API error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to load products"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
