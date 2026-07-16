<div align="center">
  <h1 align="center">Minecraft Texture Pack Merger</h1>
  <p align="center">
    Web application + REST API + Plugin system for merging Minecraft resource packs
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/plib-osp/Minecraft-Texture-Pack-Merger" alt="License" /></a>
    <a href="https://github.com/plib-osp/Minecraft-Texture-Pack-Merger"><img src="https://img.shields.io/github/stars/plib-osp/Minecraft-Texture-Pack-Merger?style=flat" alt="Stars" /></a>
  </p>
</div>

<br />

## ✨ Features

- **Web App** — Runs entirely in your browser. No files uploaded to any server. Drag-and-drop to add packs.
- **URL Loading** — Load remote resource packs directly by entering their URL.
- **REST API** — Serverless API for programmatic merge operations.
- **Plugin System** — Extend the merge pipeline with custom logic (metadata fixes, file filtering, conflict overrides).
- **Client SDK** — TypeScript API client for integrating merge into your own site.
- **Conflict Management** — Auto-merge or file-by-file conflict resolution.
- **Metadata Editing** — Customize pack_format, description, and icon.
- **Config Export** — Export merge settings as JSON.
- **cURL Support** — One-click copy of API request commands.
- **Vercel Deploy** — Deploy with a single command.

## 📦 Project Structure

```
minecraft-pack-merger/
├── api/                    # Vercel Serverless Functions
│   ├── merge.ts            # POST /api/merge
│   ├── merge/[id].ts       # GET/DELETE /api/merge/:id
│   ├── merge/[id]/download.ts
│   ├── merge/[id]/metadata.ts
│   ├── merge/[id]/resolve.ts
│   ├── packs.ts            # POST /api/packs
│   ├── plugins.ts          # GET/POST /api/plugins
│   └── _lib/               # Storage, response helpers
├── src/                    # React SPA
│   ├── App.tsx             # Main application
│   ├── components/         # UI components
│   │   ├── pack-uploader.tsx
│   │   ├── priority-list.tsx
│   │   ├── conflict-table.tsx
│   │   ├── merge-result.tsx
│   │   └── api-docs.tsx    # API documentation page
│   └── lib/                # Utilities
├── packages/
│   ├── core/               # @pack-merge/core
│   │   └── src/
│   │       ├── engine/     # Merge engine
│   │       │   ├── loader.ts        # Pack loading (File, URL, Buffer)
│   │       │   ├── validator.ts     # pack.mcmeta validation
│   │       │   ├── conflict.ts      # Conflict detection
│   │       │   ├── merger.ts        # Merge pipeline
│   │       │   └── metadata.ts      # Metadata manipulation
│   │       └── plugin/     # Plugin system
│   │           ├── types.ts         # MergePlugin interface
│   │           └── registry.ts      # Plugin registry + hook executor
│   └── client-sdk/         # @pack-merge/client-sdk
│       └── src/
│           ├── client.ts           # API client
│           └── react/              # React hooks
├── docs/                   # Documentation
│   ├── API.md              # API reference
│   ├── PLUGINS.md          # Plugin development guide
│   └── DEPLOY.md           # Deployment guide
├── public/
├── LICENSE                 # Apache 2.0
├── vercel.json             # Vercel configuration
└── package.json            # npm workspaces
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser. Drag-and-drop or enter a URL to load resource packs, reorder them by priority, and merge.

## 📡 API Usage

```bash
curl -X POST https://your-app.vercel.app/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "packs": [
      { "type": "url", "url": "https://example.com/pack1.zip" },
      { "type": "url", "url": "https://example.com/pack2.zip" }
    ],
    "priority": ["pack1", "pack2"],
    "output": {
      "name": "merged-pack",
      "description": "Merged resource pack"
    }
  }'
```

Full API reference: [docs/API.md](./docs/API.md)

## 🔌 Plugin System

Plugins let you inject custom logic into the merge pipeline. Available hooks:

| Hook | When | Purpose |
|---|---|---|
| `onBeforeMerge` | Before merge starts | Transform packs, reorder, add/remove files |
| `onAfterMerge` | After merge completes | Logging, notifications, analytics |
| `onConflictDetect` | After conflicts are found | Apply override rules |
| `onValidate` | After a pack is loaded | Extra validation checks |
| `onTransformMetadata` | Before metadata is written | Modify pack_format, description |
| `onBeforeWrite` | Before ZIP is written | Final file transforms (scale, filter) |

Plugin development guide: [docs/PLUGINS.md](./docs/PLUGINS.md)

## 💻 Client SDK

```typescript
import { PackMergeClient } from "@pack-merge/client-sdk"

const client = new PackMergeClient({
  baseUrl: "https://your-app.vercel.app"
})

const job = await client.merge({
  packs: [{ type: "url", url: "https://site.com/pack.zip" }],
  output: { name: "my-pack" }
})

// Show the download link to the user
console.log(job.downloadUrl)
```


