import JSZip from "jszip"
import type {
  TexturePack,
  PackFile,
  MergeProgress,
  OutputMetadata,
  MergeJob,
} from "../types.ts"
import { generateId } from "./loader.ts"
import { generateMcmeta } from "./metadata.ts"
import { detectConflicts } from "./conflict.ts"
import { PluginRegistry } from "../plugin/registry.ts"
import type { MergePlugin } from "../plugin/types.ts"
import { loadPack } from "./loader.ts"
import type { PackSource } from "../types.ts"

export interface MergeOptions {
  packs: (TexturePack | { type: "url"; url: string })[]
  priority?: string[]
  resolutions?: Map<string, string>
  output?: Partial<OutputMetadata>
  plugins?: MergePlugin[]
  autoResolve?: boolean
  onProgress?: (progress: MergeProgress) => void
}

export async function mergePacks(
  packs: TexturePack[],
  resolutions: Map<string, string>,
  outputMeta: OutputMetadata,
  onProgress?: (progress: MergeProgress) => void,
  pluginRegistry?: PluginRegistry
): Promise<Blob> {
  const resolvedPacks = [...packs]
  const resolvedResolutions = new Map(resolutions)

  if (pluginRegistry) {
    const beforeCtx = await pluginRegistry.executeOnBeforeMerge({
      packs: resolvedPacks,
      priority: resolvedPacks.map((p) => p.id),
      resolutions: resolvedResolutions,
      output: outputMeta,
    })
    resolvedPacks.length = 0
    resolvedPacks.push(...beforeCtx.packs)
    outputMeta = beforeCtx.output
  }

  const zip = new JSZip()
  const prioritizedFileMap = new Map<string, PackFile>()
  const priorityOrder = resolvedPacks.map((p) => p.id)

  for (const packId of priorityOrder) {
    const pack = resolvedPacks.find((p) => p.id === packId)
    if (!pack) continue

    for (const file of pack.files) {
      const resolution = resolvedResolutions.get(file.path)
      const chosenPackId = resolution ?? packId

      if (chosenPackId === packId && !prioritizedFileMap.has(file.path)) {
        prioritizedFileMap.set(file.path, file)
      }
    }
  }

  let filesArray = Array.from(prioritizedFileMap.entries()).map(
    ([_path, file]) => file
  )

  if (pluginRegistry) {
    const writeCtx = await pluginRegistry.executeOnBeforeWrite({
      files: filesArray,
      output: outputMeta,
    })
    filesArray = writeCtx.files
  }

  let metadataOutput = outputMeta
  if (pluginRegistry) {
    const metaCtx = await pluginRegistry.executeOnTransformMetadata({
      metadata: outputMeta,
      packs: resolvedPacks,
    })
    metadataOutput = metaCtx.metadata
  }

  const mcmetaJson = generateMcmeta(metadataOutput, resolvedPacks)
  zip.file("pack.mcmeta", mcmetaJson)

  if (metadataOutput.iconDataUrl) {
    try {
      const response = await fetch(metadataOutput.iconDataUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      zip.file("pack.png", new Uint8Array(buffer), { binary: true })
    } catch {}
  }

  const total = filesArray.length
  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i]
    zip.file(file.path, file.data, { binary: true })
    onProgress?.({ current: i + 1, total, phase: "merging" })
  }

  onProgress?.({ current: total, total, phase: "done" })
  const blob = await zip.generateAsync({ type: "blob" })

  if (pluginRegistry) {
    await pluginRegistry.executeOnAfterMerge({
      packs: resolvedPacks,
      output: metadataOutput,
      blob,
      duration: 0,
    })
  }

  return blob
}

export async function createMergeJob(
  options: MergeOptions,
  pluginRegistry?: PluginRegistry
): Promise<MergeJob> {
  const jobId = generateId()
  const onProgress = options.onProgress

  onProgress?.({ current: 0, total: 0, phase: "reading" })

  const resolvedPacks: TexturePack[] = []
  for (const pack of options.packs) {
    if ("files" in pack) {
      resolvedPacks.push(pack as TexturePack)
    } else if ((pack as PackSource).type === "url") {
      const loaded = await loadPack(pack as PackSource)
      resolvedPacks.push(loaded)
    }
  }

  const priority =
    options.priority ?? resolvedPacks.map((p) => p.name)

  onProgress?.({ current: 0, total: 0, phase: "resolving" })

  let conflicts = detectConflicts(resolvedPacks)

  if (pluginRegistry) {
    const conflictCtx = await pluginRegistry.executeOnConflictDetect({
      conflicts,
      packs: resolvedPacks,
      autoResolve: options.autoResolve ?? true,
    })
    conflicts = conflictCtx.conflicts
  }

  const resolutions =
    options.resolutions ?? new Map<string, string>()

  if (options.autoResolve !== false) {
    for (const conflict of conflicts) {
      if (!resolutions.has(conflict.filePath)) {
        resolutions.set(conflict.filePath, conflict.chosenPackId)
      }
    }
  }

  const outputMeta: OutputMetadata = {
    name: options.output?.name ?? "merged-texture-pack",
    description: options.output?.description ?? "",
    packFormat: options.output?.packFormat ?? 22,
    iconDataUrl: options.output?.iconDataUrl ?? null,
  }

  const job: MergeJob = {
    id: jobId,
    status: "pending",
    progress: { current: 0, total: 0, phase: "idle" },
    config: {
      packs: resolvedPacks,
      priority,
      resolutions,
      output: outputMeta,
      autoResolve: options.autoResolve ?? true,
    },
    conflicts,
    createdAt: Date.now(),
  }

  return job
}

export async function executeMergeJob(
  job: MergeJob,
  onProgress?: (progress: MergeProgress) => void,
  pluginRegistry?: PluginRegistry
): Promise<MergeJob> {
  try {
    job.status = "processing"

    const blob = await mergePacks(
      job.config.packs,
      job.config.resolutions,
      job.config.output,
      (progress) => {
        job.progress = progress
        onProgress?.(progress)
      },
      pluginRegistry
    )

    job.status = "completed"
    job.resultBlob = blob
    job.progress = { current: job.progress.total, total: job.progress.total, phase: "done" }
  } catch (err) {
    job.status = "failed"
    job.error = err instanceof Error ? err.message : "Unknown error"
  }

  return job
}
