import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "../../_lib/response.ts"

const app = new Hono()

app.put("/", async (c) => {
  const id = c.req.param("id")

  try {
    const body = await c.req.json<{
      description?: string
      packFormat?: number
    }>()

    return success(c, {
      id,
      updated: true,
      metadata: body,
    })
  } catch (err) {
    return error(c, "INVALID_INPUT", err instanceof Error ? err.message : "Invalid metadata", 400)
  }
})

export const PUT = handle(app)
