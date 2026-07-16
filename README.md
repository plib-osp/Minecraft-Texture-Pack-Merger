<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="logo" />
  <h1 align="center">Minecraft Texture Pack Merger</h1>
  <p align="center">
    Minecraft resource pack'lerini birleştirmek için web uygulaması + REST API + Plugin sistemi
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License" /></a>
    <a href="https://github.com/plib-osp/Minecraft-Texture-Pack-Merger/releases"><img src="https://img.shields.io/github/v/release/plib-osp/Minecraft-Texture-Pack-Merger" alt="Release" /></a>
    <a href="https://github.com/plib-osp/Minecraft-Texture-Pack-Merger"><img src="https://img.shields.io/github/stars/plib-osp/Minecraft-Texture-Pack-Merger?style=flat" alt="Stars" /></a>
  </p>
</div>

<br />

## ✨ Features

- **Web App** — Tarayıcıda çalışır, dosyalar sunucuya yüklenmez. Drag-drop ile pack ekle
- **URL ile yükleme** — Uzaktaki resource pack'lerini URL girerek doğrudan yükle
- **REST API** — Programatik merge işlemleri için serverless API
- **Plugin Sistemi** — Merge pipeline'ına özel işlemler ekleme (metadata düzeltme, dosya filtreleme, override)
- **Client SDK** — TypeScript API istemcisi, kendi sitene entegre et
- **Conflict Yönetimi** — Auto-merge veya file-by-file conflict çözümü
- **Metadata Düzenleme** — pack_format, description, icon özelleştirme
- **Config Export** — Merge ayarlarını JSON olarak dışa aktar
- **cURL Desteği** — API isteklerini tek tıkla kopyala
- **Vercel Deploy** — Tek komutla deploy edilebilir

## 📦 Proje Yapısı

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
├── src/                    # React web uygulaması (SPA)
│   ├── App.tsx             # Ana uygulama
│   ├── components/         # UI bileşenleri
│   │   ├── pack-uploader.tsx
│   │   ├── priority-list.tsx
│   │   ├── conflict-table.tsx
│   │   ├── merge-result.tsx
│   │   └── api-docs.tsx    # API dökümantasyon sayfası
│   └── lib/                # Yardımcılar
├── packages/
│   ├── core/               # @pack-merge/core
│   │   └── src/
│   │       ├── engine/     # Merge motoru
│   │       │   ├── loader.ts        # Pack yükleme (File, URL, Buffer)
│   │       │   ├── validator.ts     # pack.mcmeta doğrulama
│   │       │   ├── conflict.ts      # Conflict tespiti
│   │       │   ├── merger.ts        # Ana merge pipeline
│   │       │   └── metadata.ts      # Metadata manipülasyonu
│   │       └── plugin/     # Plugin sistemi
│   │           ├── types.ts         # MergePlugin arayüzü
│   │           └── registry.ts      # Plugin registry + hook executor
│   └── client-sdk/         # @pack-merge/client-sdk
│       └── src/
│           ├── client.ts           # API istemcisi
│           └── react/              # React hook'ları
├── docs/                   # Dokümantasyon
│   ├── API.md              # API referansı
│   ├── PLUGINS.md          # Plugin geliştirme kılavuzu
│   └── DEPLOY.md           # Deployment kılavuzu
├── public/
├── LICENSE                 # Apache 2.0
├── vercel.json             # Vercel yapılandırması
└── package.json            # npm workspaces
```

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcında `http://localhost:5173` adresini aç. Resource pack'lerini sürükle-bırak veya URL girerek yükle, sırala ve birleştir.

## 📡 API Kullanımı

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
      "description": "Birleştirilmiş resource pack"
    }
  }'
```

Detaylı API dokümantasyonu: [docs/API.md](./docs/API.md)

## 🔌 Plugin Sistemi

Plugin'ler merge pipeline'ına özel işlemler eklemenizi sağlar. Mevcut hook'lar:

| Hook | Ne Zaman | Ne Yapar |
|---|---|---|
| `onBeforeMerge` | Merge başlamadan | Pack'leri dönüştür, sırayı değiştir |
| `onAfterMerge` | Merge tamamlanınca | Log, bildirim, analiz |
| `onConflictDetect` | Conflict tespitinde | Override kuralları uygula |
| `onValidate` | Pack yüklenince | Ek doğrulama |
| `onTransformMetadata` | Metadata yazılırken | pack_format, description değiştir |
| `onBeforeWrite` | ZIP yazılmadan | Dosya transformları |

Detaylı plugin rehberi: [docs/PLUGINS.md](./docs/PLUGINS.md)

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

// Kullanıcıya indirme linki göster
console.log(job.downloadUrl)
```

## 📄 Lisans

Bu proje **Apache License 2.0** ile lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

```
Copyright 2026 pozii

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 🛠 Tech Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Hono.js · JSZip · Vercel Serverless · shadcn/ui · Phosphor Icons
