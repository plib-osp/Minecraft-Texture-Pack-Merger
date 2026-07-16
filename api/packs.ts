import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "./_lib/response.ts"
import { validatePackBuffer, loadPackFromBuffer } from "@pack-merge/core"
import { storeBuffer } from "./_lib/storage.ts"

const app = new Hono()

app.post("/", async (c) => {
  try {
    const contentType = c.req.header("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData()
      const file = formData.get("pack") as File | null
      if (!file) {
        return error(c, "NO_FILE", "No pack file provided")
      }

      const buffer = await file.arrayBuffer()
      const validation = await validatePackBuffer(buffer, file.name)
      if (!validation.valid) {
        return error(c, "INVALID_PACK", validation.error ?? "Invalid pack")
      }

      const pack = await loadPackFromBuffer(buffer, file.name.replace(/\.zip$/i, ""))
      await storeBuffer(pack.id, buffer, pack.name)

      return success(c, {
        id: pack.id,
        name: pack.name,
        fileCount: pack.fileCount,
        description: pack.description,
      }, 201)
    }

    const body = await c.req.json<{ url?: string }>()
    if (body.url) {
      const response = await fetch(body.url)
      if (!response.ok) {
        return error(c, "FETCH_FAILED", `Failed to fetch pack from URL: ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      const name = body.url.split("/").pop()?.replace(/\.zip$/i, "") || "remote-pack"
      const pack = await loadPackFromBuffer(buffer, name)
      await storeBuffer(pack.id, buffer, pack.name)

      return success(c, {
        id: pack.id,
        name: pack.name,
        fileCount: pack.fileCount,
        source: body.url,
      }, 201)
    }

    return error(c, "INVALID_INPUT", "Provide a file (multipart) or a URL (JSON)")
  } catch (err) {
    return error(c, "UPLOAD_FAILED", err instanceof Error ? err.message : "Upload failed", 500)
  }
})

app.get("/", (c) => {
  return success(c, { message: "List packs endpoint" })
})

export const POST = handle(app)
export const GET = handle(app)
