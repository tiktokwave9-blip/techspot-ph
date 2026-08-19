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

    return Response.json(results);
  } catch (error) {
    return Response.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
