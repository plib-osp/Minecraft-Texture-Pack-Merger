import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "../_lib/response.ts"

const app = new Hono()

const jobs = new Map<string, any>()

app.get("/", (c) => {
  const id = c.req.param("id")
  const job = jobs.get(id)

  if (!job) {
    return error(c, "NOT_FOUND", "Merge job not found", 404)
  }

  return success(c, {
    id: job.id,
    status: job.status,
    progress: job.progress,
    conflicts: job.conflicts,
    error: job.error,
    downloadUrl: `/api/merge/${job.id}/download`,
  })
})

app.delete("/", (c) => {
  const id = c.req.param("id")
  if (!jobs.has(id)) {
    return error(c, "NOT_FOUND", "Merge job not found", 404)
  }
  jobs.delete(id)
  return success(c, { deleted: true })
})

export const GET = handle(app)
export const DELETE = handle(app)
