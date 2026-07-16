import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "../../_lib/response.ts"

const app = new Hono()

app.post("/", async (c) => {
  const id = c.req.param("id")

  try {
    const body = await c.req.json<{
      resolutions: Record<string, string>
    }>()

    if (!body.resolutions || Object.keys(body.resolutions).length === 0) {
      return error(c, "NO_RESOLUTIONS", "At least one resolution is required")
    }

    return success(c, {
      id,
      resolved: true,
      resolutionCount: Object.keys(body.resolutions).length,
    })
  } catch (err) {
    return error(c, "INVALID_INPUT", err instanceof Error ? err.message : "Invalid resolution data", 400)
  }
})

export const POST = handle(app)
