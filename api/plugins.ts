import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "./_lib/response.ts"

const app = new Hono()

const registeredPlugins = new Map<string, { name: string; version: string; description?: string }>()

app.get("/", (c) => {
  return success(c, {
    plugins: Array.from(registeredPlugins.values()),
  })
})

app.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      name: string
      version: string
      description?: string
    }>()

    if (!body.name || !body.version) {
      return error(c, "INVALID_PLUGIN", "Plugin name and version are required")
    }

    if (registeredPlugins.has(body.name)) {
      return error(c, "PLUGIN_EXISTS", `Plugin "${body.name}" is already registered`)
    }

    registeredPlugins.set(body.name, {
      name: body.name,
      version: body.version,
      description: body.description,
    })

    return success(c, { name: body.name, registered: true }, 201)
  } catch (err) {
    return error(c, "REGISTRATION_FAILED", err instanceof Error ? err.message : "Plugin registration failed", 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
