# Minecraft Texture Pack Merger

Minecraft resource pack'lerini birleştirmek için web uygulaması + REST API + Plugin sistemi.

- **Web App**: Tarayıcıda çalışır, dosyalar sunucuya yüklenmez
- **REST API**: Programatik merge işlemleri
- **Plugin Sistemi**: Genişletilebilir merge pipeline
- **Client SDK**: TypeScript API istemcisi

[📖 Dokümantasyon](./docs/README.md) · [🌐 API Referansı](./docs/API.md) · [🔌 Plugin Geliştirme](./docs/PLUGINS.md) · [🚀 Deployment](./docs/DEPLOY.md)

## Hızlı Başlangıç

```bash
npm install
npm run dev
```

## API Kullanımı

```bash
curl -X POST https://your-app.vercel.app/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "packs": [{ "type": "url", "url": "https://example.com/pack.zip" }],
    "output": { "name": "merged-pack" }
  }'
```

## Tech Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Hono.js · JSZip · Vercel Serverless
