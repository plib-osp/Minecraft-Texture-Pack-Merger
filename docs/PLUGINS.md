# Plugin Development Guide

Plugins let you inject custom logic into the merge pipeline.

## Plugin Interface

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

## Hooks and Execution Order

```
VALIDATE → LOAD → DETECT CONFLICTS → RESOLVE → MERGE → WRITE ZIP
  |          |           |              |         |         |
  |     onValidate  onConflictDetect    |   onBefore   onBeforeWrite
  |                                     |    Merge         |
  |                               onTransform          onAfterMerge
  |                               Metadata
```

### Hook Details

| Hook | Triggered When | What You Can Do |
|---|---|---|
| `onValidate` | After a pack is loaded | Add validation, process errors/warnings |
| `onConflictDetect` | After conflicts are detected | Apply custom override rules |
| `onBeforeMerge` | Before merge starts | Transform packs, change order, add/remove files |
| `onTransformMetadata` | While metadata is being built | Modify pack_format, description |
| `onBeforeWrite` | Before writing to ZIP | Final file transforms (scale, convert, filter) |
| `onAfterMerge` | After merge completes | Logging, notifications, analytics |

## Example Plugins

### 1. Metadata Fixer

```typescript
const metaFixer = {
  name: "meta-fixer",
  version: "1.0.0",
  description: "Auto-fixes output metadata",

  onTransformMetadata: async (ctx) => ({
    ...ctx,
    metadata: {
      ...ctx.metadata,
      description: ctx.metadata.description || "Auto-generated",
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
  description: "Only includes the textures/ folder",

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
  description: "Ensures a specific pack wins for PBR files",

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

## Using Plugins

### With the API:

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

### Directly with Core:

```typescript
import { PluginRegistry, mergePacks } from "@pack-merge/core"

const registry = new PluginRegistry()
registry.register(metaFixer)
registry.register(textureFilter)

const blob = await mergePacks(packs, resolutions, output, onProgress, registry)
```
