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
      {
        error: "Failed to load products",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}


export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const {
      name,
      price,
      description = "",
      image_url = "",
      rating = 0,
      rating_count = 0,
      stock = 0
    } = body;

    if (!name || price === undefined) {
      return Response.json(
        {
          error: "Product name and price are required"
        },
        { status: 400 }
      );
    }

    const result = await context.env.TECHSPOT_DB
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
        name,
        price,
        description,
        image_url,
        rating,
        rating_count,
        stock
      )
      .run();

    return Response.json(
      {
        success: true,
        message: "Product added successfully",
        id: result.meta?.last_row_id
      },
      { status: 201 }
    );

  } catch (error) {
    return Response.json(
      {
        error: "Failed to add product",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}


export async function onRequestPut(context) {
  try {
    const body = await context.request.json();

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

    if (!id) {
      return Response.json(
        {
          error: "Product ID is required"
        },
        { status: 400 }
      );
    }

    if (!name || price === undefined) {
      return Response.json(
        {
          error: "Product name and price are required"
        },
        { status: 400 }
      );
    }

    const result = await context.env.TECHSPOT_DB
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
        name,
        price,
        description,
        image_url,
        rating,
        rating_count,
        stock,
        id
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
      success: true,
      message: "Product updated successfully"
    });

  } catch (error) {
    return Response.json(
      {
        error: "Failed to update product",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}


export async function onRequestDelete(context) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          error: "Product ID is required"
        },
        { status: 400 }
      );
    }

    const result = await context.env.TECHSPOT_DB
      .prepare(`
        DELETE FROM products
        WHERE id = ?
      `)
      .bind(id)
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
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    return Response.json(
      {
        error: "Failed to delete product",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
