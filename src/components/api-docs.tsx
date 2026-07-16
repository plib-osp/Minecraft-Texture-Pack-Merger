import { ArrowLeft, Code, Download, Globe, Link as LinkIcon, Plugs } from "@phosphor-icons/react"

interface ApiDocsProps {
  onBack: () => void
}

export function ApiDocs({ onBack }: ApiDocsProps) {
  const endpoint = (method: string, path: string, desc: string, body?: string, note?: string) => (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${
          method === "GET" ? "bg-green-500/15 text-green-600" :
          method === "POST" ? "bg-blue-500/15 text-blue-600" :
          method === "PUT" ? "bg-orange-500/15 text-orange-600" :
          "bg-red-500/15 text-red-600"
        }`}>{method}</span>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <p className="mb-2 text-sm text-muted-foreground">{desc}</p>
      {body && (
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          <code>{body}</code>
        </pre>
      )}
      {note && <p className="mt-1 text-xs text-muted-foreground italic">{note}</p>}
    </div>
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-4 py-8 sm:p-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="rounded-lg border bg-card p-2 text-card-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            REST API for programmatic texture pack merging
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <h2 className="mb-2 text-sm font-semibold flex items-center gap-2">
          <Globe className="size-4" />
          Base URL
        </h2>
        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
          https://your-app.vercel.app/api
        </code>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Code className="size-4" />
          Merge Operations
        </h2>
        <div className="space-y-3">
          {endpoint("POST", "/api/merge",
            "Start a merge job. Submit packs by URL, set priority order, and configure output metadata.",
            `{
  "packs": [
    { "type": "url", "url": "https://example.com/pack1.zip" },
    { "type": "url", "url": "https://example.com/pack2.zip" }
  ],
  "priority": ["pack1", "pack2"],
  "autoResolve": true,
  "output": {
    "name": "merged-pack",
    "description": "My merged pack",
    "packFormat": 42
  }
}`,
            "Returns job ID. Use GET /api/merge/:id to poll status."
          )}

          {endpoint("GET", "/api/merge/:id",
            "Get merge job status, progress, and conflicts."
          )}

          {endpoint("GET", "/api/merge/:id/download",
            "Download the merged pack as a .zip file.",
            undefined,
            "Link expires after 1 hour."
          )}

          {endpoint("DELETE", "/api/merge/:id",
            "Delete a merge job and free up storage."
          )}

          {endpoint("PUT", "/api/merge/:id/metadata",
            "Update output metadata (description, pack_format) after merge.",
            `{
  "description": "Updated description",
  "packFormat": 42
}`
          )}

          {endpoint("POST", "/api/merge/:id/resolve",
            "Send conflict resolutions to override auto-resolve.",
            `{
  "resolutions": {
    "assets/minecraft/textures/block/stone.png": "pack_id_1"
  }
}`
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Download className="size-4" />
          Pack Management
        </h2>
        <div className="space-y-3">
          {endpoint("POST", "/api/packs",
            "Upload a resource pack via URL or multipart/form-data.",
            `{ "url": "https://example.com/pack.zip" }`,
            "Returns pack ID for use in merge requests."
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plugs className="size-4" />
          Plugin Management
        </h2>
        <div className="space-y-3">
          {endpoint("GET", "/api/plugins",
            "List all registered plugins."
          )}
          {endpoint("POST", "/api/plugins",
            "Register a new plugin.",
            `{
  "name": "meta-fixer",
  "version": "1.0.0",
  "description": "Auto-fixes metadata"
}`
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plugs className="size-4" />
          Plugin Hooks Reference
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Hook</th>
                <th className="px-4 py-2 text-left font-medium">When</th>
                <th className="px-4 py-2 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["onBeforeMerge", "Before merge starts", "Transform packs, reorder, add/remove files"],
                ["onAfterMerge", "After merge completes", "Logging, notifications, analytics"],
                ["onConflictDetect", "After conflicts found", "Override resolution rules"],
                ["onValidate", "After pack loaded", "Extra validation checks"],
                ["onTransformMetadata", "Before metadata written", "Modify pack_format, description"],
                ["onBeforeWrite", "Before ZIP is written", "Final file transforms (scale, filter)"],
              ].map(([hook, when, purpose], i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{hook}</td>
                  <td className="px-4 py-2 text-muted-foreground">{when}</td>
                  <td className="px-4 py-2 text-muted-foreground">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <LinkIcon className="size-4" />
          Client SDK
        </h2>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <p className="mb-2 text-sm text-muted-foreground">
            Use the TypeScript client to integrate merge functionality into your own site.
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs"><code>{`import { PackMergeClient } from "@pack-merge/client-sdk"

const client = new PackMergeClient({
  baseUrl: "https://your-app.vercel.app"
})

const job = await client.merge({
  packs: [{ type: "url", url: "https://site.com/pack.zip" }],
  output: { name: "my-pack" }
})

// job.downloadUrl -> show to user`}</code></pre>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Documentation also available on GitHub:{" "}
        <a
          href="https://github.com/plib-osp/Minecraft-Texture-Pack-Merger"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          plib-osp/Minecraft-Texture-Pack-Merger
        </a>
      </div>
    </div>
  )
}
