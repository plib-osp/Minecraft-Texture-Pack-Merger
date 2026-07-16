# Deployment Kılavuzu

## Vercel'e Deploy

### 1. GitHub'a Push

```bash
git add -A
git commit -m "feat: api + plugin sistemi"
git push origin main
```

### 2. Vercel'de Import

1. [Vercel Dashboard](https://vercel.com) → "Add New Project"
2. GitHub reposunu seç: `plib-osp/Minecraft-Texture-Pack-Merger`
3. Vercel framework otomatik olarak **Vite**'ı algılayacaktır
4. Deploy settings (genelde otomatik gelir):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Environment Variables (Opsiyonel)

| Variable | Açıklama |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (büyük pack'ler için) |

### 4. Deploy

"Deploy" butonuna tıkla. Vercel otomatik olarak:
- SPA'yı statik dosya olarak serve eder (`src/`)
- API fonksiyonlarını serverless olarak çalıştırır (`api/*.ts`)

### 5. Custom Domain (Opsiyonel)

Vercel Dashboard > Project > Settings > Domains

---

## Yerel Geliştirme

```bash
# Web uygulaması (port 5173)
npm run dev

# API'yi test etmek için
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

## Proje Yapısı (Vercel İçin)

```
minecraft-pack-merger/
├── api/              → Serverless Functions (Node.js runtime)
│   ├── merge.ts
│   ├── merge/[id].ts
│   ├── packs.ts
│   ├── plugins.ts
│   └── ...
├── src/              → SPA (Vite, otomatik algılanır)
├── packages/         → npm workspaces
│   ├── core/         → @pack-merge/core (Vercel tarafından bundle edilir)
│   └── client-sdk/   → @pack-merge/client-sdk
├── public/
├── vercel.json
├── package.json
└── vite.config.ts
```

**Not**: npm workspaces sayesinde `packages/core` ve `packages/client-sdk` Vercel build'inde otomatik olarak çözülür.
