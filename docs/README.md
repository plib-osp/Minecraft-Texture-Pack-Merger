# Minecraft Texture Pack Merger

**Client-side** web application and **REST API** for merging Minecraft resource packs.

## Features

- **Web App**: Runs in the browser, no files uploaded to servers
- **REST API**: Serverless API for programmatic merge operations
- **Plugin System**: Extend the merge pipeline with custom logic
- **Client SDK**: TypeScript client for the API
- **Vercel Deployment**: Deploy with a single command

## Quick Start

### Web App

```bash
npm install
npm run dev
```

### API Usage

```bash
curl -X POST https://your-app.vercel.app/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "packs": [
      { "type": "url", "url": "https://example.com/pack.zip" }
    ],
    "output": {
      "name": "merged-pack",
      "description": "Merged pack"
    }
  }'
```

### Client SDK

```typescript
import { PackMergeClient } from "@pack-merge/client-sdk"

const client = new PackMergeClient({
  baseUrl: "https://your-app.vercel.app"
})

const job = await client.merge({
  packs: [{ type: "url", url: "https://example.com/pack.zip" }],
  output: { name: "my-pack" }
})

// Download via job.downloadUrl
```

## Project Structure

```
minecraft-pack-merger/
├── api/             # Vercel Serverless Functions
├── src/             # React web application
├── packages/
│   ├── core/        # Merge engine + Plugin system
│   └── client-sdk/  # TypeScript API client
├── docs/            # Documentation
├── vercel.json      # Vercel configuration
└── package.json     # npm workspaces
```

## Deployment

```bash
# Deploy to Vercel
npx vercel --prod
```

Deployment guide: [DEPLOY.md](./DEPLOY.md)
API reference: [API.md](./API.md)
Plugin development: [PLUGINS.md](./PLUGINS.md)
