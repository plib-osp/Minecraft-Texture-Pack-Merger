# Plugin Geliştirme Kılavuzu

Plugin'ler, merge pipeline'ına özel işlemler eklemenizi sağlar.

## Plugin Arayüzü

```typescript
interface MergePlugin {
  name: string
  version: string
  description?: string

  onBeforeMerge?(ctx: BeforeMergeContext): Promise<BeforeMergeContext>
  onAfterMerge?(ctx: AfterMergeContext): Promise<AfterMergeContext>
  onConflictDetect?(ctx: ConflictContext): Promise<ConflictContext>
  onValidate?(ctx: ValidateContext): Promise<ValidateContext>
  onTransformMetadata?(ctx: MetadataContext): Promise<MetadataContext>
  onBeforeWrite?(ctx: WriteContext): Promise<WriteContext>
}
```

## Hook'lar ve Çalışma Sırası

```
VALIDATE → LOAD → DETECT CONFLICTS → RESOLVE → MERGE → WRITE ZIP
  |          |           |              |         |         |
  |     onValidate  onConflictDetect    |   onBefore   onBeforeWrite
  |                                     |    Merge         |
  |                               onTransform          onAfterMerge
  |                               Metadata
```

### Hook Detayları

| Hook | Tetiklendiğinde | Ne yapabilirsin |
|---|---|---|
| `onValidate` | Pack yüklendikten sonra | Ek doğrulama ekle, hataları/warning'leri işle |
| `onConflictDetect` | Conflict'ler tespit edildikten sonra | Özel override kuralları uygula |
| `onBeforeMerge` | Merge başlamadan önce | Pack'leri dönüştür, sırayı değiştir, dosya ekle/çıkar |
| `onTransformMetadata` | Metadata oluşturulurken | pack_format, description değiştir |
| `onBeforeWrite` | ZIP'e yazılmadan önce | Dosyaları son kez işle (scale, convert, filter) |
| `onAfterMerge` | Merge tamamlandıktan sonra | Log tut, bildirim gönder, analiz yap |

## Örnek Plugin'ler

### 1. Metadata Düzeltme

```typescript
const metaFixer = {
  name: "meta-fixer",
  version: "1.0.0",
  description: "Çıktı metadata'sını otomatik düzeltir",

  onTransformMetadata: async (ctx) => ({
    ...ctx,
    metadata: {
      ...ctx.metadata,
      description: ctx.metadata.description || "Otomatik oluşturuldu",
      packFormat: Math.max(ctx.metadata.packFormat, 42),
    },
  }),
}
```

### 2. Texture Filter

```typescript
const textureFilter = {
  name: "texture-filter",
  version: "1.0.0",
  description: "Sadece textures/ klasörünü dahil eder",

  onBeforeWrite: async (ctx) => ({
    ...ctx,
    files: ctx.files.filter((f) => f.path.includes("/textures/")),
  }),
}
```

### 3. Conflict Override

```typescript
const pbrOverride = {
  name: "pbr-override",
  version: "1.0.0",
  description: "PBR dosyalarında belirli pack'in kazanmasını sağlar",

  onConflictDetect: async (ctx) => {
    const overrides: Record<string, string> = {}
    for (const conflict of ctx.conflicts) {
      if (conflict.filePath.includes("_normal.png") ||
          conflict.filePath.includes("_specular.png")) {
        const pbrPack = conflict.sources.find(s => s.packName.includes("PBR"))
        if (pbrPack) {
          overrides[conflict.filePath] = pbrPack.packId
        }
      }
    }
    return { ...ctx, overrides }
  },
}
```

## Plugin Kullanımı

### API ile:

```json
POST /api/merge
{
  "packs": [{ "type": "url", "url": "..." }],
  "plugins": [
    { "name": "meta-fixer", "enabled": true },
    { "name": "texture-filter", "enabled": true }
  ]
}
```

### Doğrudan Core ile:

```typescript
import { PluginRegistry, mergePacks } from "@pack-merge/core"

const registry = new PluginRegistry()
registry.register(metaFixer)
registry.register(textureFilter)

const blob = await mergePacks(packs, resolutions, output, onProgress, registry)
```
