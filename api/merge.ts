import { Hono } from "hono"
import { handle } from "hono/vercel"
import { success, error } from "./_lib/response.ts"
import { createMergeJob, executeMergeJob, PluginRegistry } from "@pack-merge/core"
import { storeBuffer } from "./_lib/storage.ts"
import { loadPackFromUrl } from "@pack-merge/core"

const app = new Hono()

const jobs = new Map<string, Awaited<ReturnType<typeof createMergeJob>>>()

app.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      packs: { type: "url"; url: string }[]
      priority?: string[]
      output?: { name?: string; description?: string; packFormat?: number; iconDataUrl?: string }
      autoResolve?: boolean
      plugins?: { name: string; enabled: boolean }[]
    }>()

    if (!body.packs || body.packs.length === 0) {
      return error(c, "NO_PACKS", "At least one pack is required")
    }

    if (body.packs.length < 2) {
      return error(c, "NEED_MORE_PACKS", "At least two packs are required to perform a merge")
    }

    const pluginRegistry = new PluginRegistry()
    if (body.plugins) {
      for (const plugin of body.plugins) {
        if (plugin.enabled) {
          try {
            const mod = await import(/* @vite-ignore */ `../../plugins/${plugin.name}.ts`)
            if (mod.default) {
              pluginRegistry.register(mod.default)
            }
          } catch {
          }
        }
      }
    }

    const job = await createMergeJob(
      {
        packs: body.packs,
        priority: body.priority,
        output: {
          name: body.output?.name,
          description: body.output?.description,
          packFormat: body.output?.packFormat,
          iconDataUrl: body.output?.iconDataUrl ?? null,
        },
        autoResolve: body.autoResolve,
      },
      pluginRegistry
    )

    jobs.set(job.id, job)

    executeMergeJob(job, undefined, pluginRegistry).then((completed) => {
      jobs.set(completed.id, completed)
      if (completed.status === "completed" && completed.resultBlob) {
        completed.resultBlob.arrayBuffer().then((buf) => {
          storeBuffer(completed.id, buf, completed.config.output.name)
        })
      }
    })

    return success(c, {
      id: job.id,
      status: job.status,
      progress: job.progress,
      downloadUrl: `/api/merge/${job.id}/download`,
    }, 202)
  } catch (err) {
    return error(c, "MERGE_FAILED", err instanceof Error ? err.message : "Unknown error", 500)
  }
})

export const POST = handle(app)
