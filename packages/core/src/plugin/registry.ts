import type { MergePlugin } from "./types.ts"
import type {
  BeforeMergeContext,
  AfterMergeContext,
  ConflictContext,
  ValidateContext,
  MetadataContext,
  WriteContext,
} from "../types.ts"

export class PluginRegistry {
  private plugins: Map<string, MergePlugin> = new Map()

  register(plugin: MergePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }
    this.plugins.set(plugin.name, plugin)
  }

  unregister(name: string): boolean {
    return this.plugins.delete(name)
  }

  getPlugin(name: string): MergePlugin | undefined {
    return this.plugins.get(name)
  }

  listPlugins(): MergePlugin[] {
    return Array.from(this.plugins.values())
  }

  async executeOnBeforeMerge(ctx: BeforeMergeContext): Promise<BeforeMergeContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeMerge) {
        result = await plugin.onBeforeMerge(result)
      }
    }
    return result
  }

  async executeOnAfterMerge(ctx: AfterMergeContext): Promise<AfterMergeContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterMerge) {
        result = await plugin.onAfterMerge(result)
      }
    }
    return result
  }

  async executeOnConflictDetect(ctx: ConflictContext): Promise<ConflictContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onConflictDetect) {
        result = await plugin.onConflictDetect(result)
      }
    }
    return result
  }

  async executeOnValidate(ctx: ValidateContext): Promise<ValidateContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onValidate) {
        result = await plugin.onValidate(result)
      }
    }
    return result
  }

  async executeOnTransformMetadata(ctx: MetadataContext): Promise<MetadataContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onTransformMetadata) {
        result = await plugin.onTransformMetadata(result)
      }
    }
    return result
  }

  async executeOnBeforeWrite(ctx: WriteContext): Promise<WriteContext> {
    let result = ctx
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeWrite) {
        result = await plugin.onBeforeWrite(result)
      }
    }
    return result
  }

  clear(): void {
    this.plugins.clear()
  }
}
