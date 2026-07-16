import { Hono } from "hono"
import { handle } from "hono/vercel"
import { error } from "../../_lib/response.ts"
import { getBuffer } from "../../_lib/storage.ts"

const app = new Hono()

app.get("/", async (c) => {
  const id = c.req.param("id")
  const buffer = await getBuffer(id)

  if (!buffer) {
    return error(c, "NOT_FOUND", "Download not available or expired", 404)
  }

  c.header("Content-Type", "application/zip")
  c.header("Content-Disposition", `attachment; filename="merged-${id.slice(0, 8)}.zip"`)
  return c.body(buffer)
})

export const GET = handle(app)
