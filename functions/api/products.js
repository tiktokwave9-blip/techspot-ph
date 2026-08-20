import { verifySession } from "../../_auth.js";

function unauthorized() {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store"
      }
    }
  );
}

async function requireAdmin(context) {
  return await verifySession(
    context.request,
    context.env.SESSION_SECRET
  );
}

export async function onRequestGet(context) {
  try {
    const { results } =
      await context.env.TECHSPOT_DB
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

    return new Response(
      JSON.stringify(results || []),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json; charset=UTF-8",
          "X-Content-Type-Options":
            "nosniff",
          "Cache-Control":
            "public, max-age=60"
        }
      }
    );

  } catch (error) {
    console.error(
      "Products API error:",
      error
    );

    return new Response(
      JSON.stringify({
        error: "Unable to load products"
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json; charset=UTF-8",
          "X-Content-Type-Options":
            "nosniff",
          "Cache-Control":
            "no-store"
        }
      }
    );
  }
}

export async function onRequestPost(context) {

  if (!await requireAdmin(context)) {
    return unauthorized();
  }

  try {

    const body =
      await context.request.json();

    const {
      name,
      price,
      description = "",
      image_url = "",
      rating = 0,
      rating_count = 0,
      stock = 0
    } = body;

    if (
      !name ||
      price === undefined ||
      !Number.isFinite(Number(price))
    ) {
      return Response.json(
        {
          error:
            "Valid product name and price are required"
        },
        { status: 400 }
      );
    }

    const result =
      await context.env.TECHSPOT_DB
        .prepare(`
          INSERT INTO products
          (
            name,
            price,
            description,
            image_url,
            rating,
            rating_count,
            stock,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          String(name).trim(),
          Number(price),
          String(description),
          String(image_url),
          Number(rating),
          Number(rating_count),
          Number(stock)
        )
        .run();

    return Response.json({
      success: true,
      id: result.meta?.last_row_id
    });

  } catch (error) {

    console.error(
      "Add product error:",
      error
    );

    return Response.json(
      {
        error: "Unable to add product"
      },
      { status: 500 }
    );
  }
}

export async function onRequestPut(context) {

  if (!await requireAdmin(context)) {
    return unauthorized();
  }

  try {

    const body =
      await context.request.json();

    const {
      id,
      name,
      price,
      description = "",
      image_url = "",
      rating = 0,
      rating_count = 0,
      stock = 0
    } = body;

    if (
      !id ||
      !name ||
      price === undefined ||
      !Number.isFinite(Number(price))
    ) {
      return Response.json(
        {
          error:
            "Product ID, name and valid price are required"
        },
        { status: 400 }
      );
    }

    const result =
      await context.env.TECHSPOT_DB
        .prepare(`
          UPDATE products
          SET
            name = ?,
            price = ?,
            description = ?,
            image_url = ?,
            rating = ?,
            rating_count = ?,
            stock = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          String(name).trim(),
          Number(price),
          String(description),
          String(image_url),
          Number(rating),
          Number(rating_count),
          Number(stock),
          Number(id)
        )
        .run();

    if (!result.meta?.changes) {
      return Response.json(
        {
          error: "Product not found"
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true
    });

  } catch (error) {

    console.error(
      "Update product error:",
      error
    );

    return Response.json(
      {
        error: "Unable to update product"
      },
      { status: 500 }
    );
  }
}

export async function onRequestDelete(context) {

  if (!await requireAdmin(context)) {
    return unauthorized();
  }

  try {

    const url =
      new URL(context.request.url);

    const id =
      url.searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          error: "Product ID is required"
        },
        { status: 400 }
      );
    }

    const result =
      await context.env.TECHSPOT_DB
        .prepare(`
          DELETE FROM products
          WHERE id = ?
        `)
        .bind(Number(id))
        .run();

    if (!result.meta?.changes) {
      return Response.json(
        {
          error: "Product not found"
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true
    });

  } catch (error) {

    console.error(
      "Delete product error:",
      error
    );

    return Response.json(
      {
        error: "Unable to delete product"
      },
      { status: 500 }
    );
  }
}
