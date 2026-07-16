# Deployment Guide

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add -A
git commit -m "feat: api + plugin system"
git push origin main
```

### 2. Import in Vercel

1. [Vercel Dashboard](https://vercel.com) → "Add New Project"
2. Select your GitHub repo: `plib-osp/Minecraft-Texture-Pack-Merger`
3. Vercel will automatically detect **Vite**
4. Default deploy settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Environment Variables (Optional)

| Variable | Description |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (for large packs) |

### 4. Deploy

Click "Deploy". Vercel automatically:
- Serves the SPA as static files (`src/`)
- Runs API functions as serverless (`api/*.ts`)

### 5. Custom Domain (Optional)

Vercel Dashboard > Project > Settings > Domains

---

## Local Development

```bash
# Web app (port 5173)
npm run dev

# Test the API
npm run dev:api
```

---

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

---

## Project Structure (for Vercel)

```
minecraft-pack-merger/
├── api/              → Serverless Functions (Node.js runtime)
│   ├── merge.ts
│   ├── merge/[id].ts
│   ├── packs.ts
│   ├── plugins.ts
│   └── ...
├── src/              → SPA (Vite, auto-detected)
├── packages/         → npm workspaces
│   ├── core/         → @pack-merge/core (bundled by Vercel)
│   └── client-sdk/   → @pack-merge/client-sdk
├── public/
├── vercel.json
├── package.json
└── vite.config.ts
```

**Note**: npm workspaces automatically resolve `packages/core` and `packages/client-sdk` during Vercel builds.
