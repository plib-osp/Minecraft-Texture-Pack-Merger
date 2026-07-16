# Minecraft Texture Pack Merger

Minecraft resource pack'lerini birleştirmek için **client-side** web uygulaması ve **REST API**.

## Özellikler

- **Web Uygulaması**: Tarayıcıda çalışır, dosyalar sunucuya yüklenmez
- **REST API**: Programatik merge işlemleri için serverless API
- **Plugin Sistemi**: Merge pipeline'ına özel işlemler ekleme
- **Client SDK**: API'yi kullanmak için TypeScript istemci
- **Vercel Deployment**: Tek komutla deploy

## Hızlı Başlangıç

### Web Uygulaması

```bash
npm install
npm run dev
```

### API Kullanımı

```bash
curl -X POST https://your-app.vercel.app/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "packs": [
      { "type": "url", "url": "https://example.com/pack.zip" }
    ],
    "output": {
      "name": "merged-pack",
      "description": "Birleştirilmiş pack"
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

// job.downloadUrl ile indir
```

## Proje Yapısı

```
minecraft-pack-merger/
├── api/             # Vercel Serverless Functions
├── src/             # React web uygulaması
├── packages/
│   ├── core/        # Merge motoru + Plugin sistemi
│   └── client-sdk/  # TypeScript API istemcisi
├── docs/            # Dokümantasyon
├── vercel.json      # Vercel yapılandırması
└── package.json     # npm workspaces
```

## Deployment

```bash
# Vercel'e deploy
npx vercel --prod
```

Detaylı deployment kılavuzu: [DEPLOY.md](./DEPLOY.md)
API referansı: [API.md](./API.md)
Plugin geliştirme: [PLUGINS.md](./PLUGINS.md)
