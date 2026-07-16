import JSZip from "jszip"
import type {
  TexturePack,
  PackFile,
  Conflict,
  MergeProgress,
  PackValidation,
} from "./types"

const IGNORED_PATHS = new Set([
  "__MACOSX",
  ".DS_Store",
  "manifest.json",
  "pack.png",
  "pack.mcmeta",
])

function shouldIgnore(relativePath: string): boolean {
  const segments = relativePath.replace(/\/$/, "").split("/")
  return segments.some((s) => IGNORED_PATHS.has(s))
}

function generateId(): string {
  return crypto.randomUUID()
}

export async function validatePack(file: File): Promise<PackValidation> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const paths = Object.keys(zip.files)
    const rootFiles = new Set(
      paths
        .filter((p) => !p.includes("/"))
        .map((p) => p.replace(/\/$/, ""))
    )
    const rootDirs = new Set(
      paths
        .filter((p) => p.includes("/"))
        .map((p) => p.split("/")[0])
    )

    if (!rootFiles.has("pack.mcmeta")) {
      return {
        valid: false,
        error:
          "No `pack.mcmeta` found in the pack root. Minecraft resource packs require a `pack.mcmeta` file to be recognized by the game.",
      }
    }

    const mcmetaEntry = zip.files["pack.mcmeta"]
    const mcmetaRaw = await mcmetaEntry.async("text")

    let mcmeta: Record<string, unknown>
    try {
      mcmeta = JSON.parse(mcmetaRaw)
    } catch {
      return {
        valid: false,
        error:
          "`pack.mcmeta` is not valid JSON. Check for missing braces, commas, or trailing commas.",
      }
    }

    const packSection =
      mcmeta && typeof mcmeta === "object" && "pack" in mcmeta
        ? (mcmeta.pack as Record<string, unknown>)
        : null
    if (!packSection || typeof packSection !== "object") {
      return {
        valid: false,
        error:
          "`pack.mcmeta` must have a `\"pack\"` object at the top level. Example: `{ \"pack\": { \"pack_format\": 22, \"description\": \"...\" } }`",
      }
    }

    const hasPackFormat =
      "pack_format" in packSection &&
      typeof packSection.pack_format === "number"

    const hasMinFormat =
      "min_format" in packSection && typeof packSection.min_format === "number"

    if (!hasPackFormat && !hasMinFormat) {
      return {
        valid: false,
        error:
          "`pack.mcmeta` is missing `pack_format` (or `min_format` for 1.21.9+). Add `\"pack_format\": <number>` to the `\"pack\"` object.",
      }
    }

    const hasMaxFormat =
      "max_format" in packSection &&
      typeof packSection.max_format === "number"

    if (hasMinFormat && !hasMaxFormat) {
      return {
        valid: false,
        error:
          "`pack.mcmeta` has `min_format` but is missing `max_format`. Both are required for 1.21.9+ packs.",
      }
    }

    if (!("description" in packSection)) {
      return {
        valid: false,
        error:
          "`pack.mcmeta` is missing a `description` field. Add `\"description\": \"My pack\"` to the `\"pack\"` object.",
      }
    }

    const description = packSection.description
    if (
      typeof description !== "string" &&
      !(
        typeof description === "object" &&
        description !== null &&
        !Array.isArray(description)
      )
    ) {
      return {
        valid: false,
        error:
          "`pack.description` must be a text string or a valid text component JSON object.",
      }
    }

    if (
      !rootDirs.has("assets") &&
      !paths.some((p) => p.startsWith("assets/") && !zip.files[p].dir)
    ) {
      return {
        valid: false,
        error:
          "No `assets/` folder found. Resource packs must contain an `assets/` directory with at least one namespace (e.g. `assets/minecraft/`).",
      }
    }

    const assetFilesUnderAssets = paths.filter(
      (p) => p.startsWith("assets/") && !zip.files[p].dir
    )
    if (assetFilesUnderAssets.length === 0) {
      return {
        valid: false,
        error:
          "The `assets/` folder is empty. A valid resource pack needs texture files inside `assets/<namespace>/textures/` or similar.",
      }
    }

    const packName =
      (packSection.description as string) ||
      file.name.replace(/\.zip$/i, "")

    return { valid: true, packName: packName.length > 40 ? packName : packName }
  } catch (err) {
    return {
      valid: false,
      error: `Could not read the zip file. It may be corrupted: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function loadPack(file: File): Promise<TexturePack> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  let description = ""
  const mcmetaEntry = zip.files["pack.mcmeta"]
  if (mcmetaEntry && !mcmetaEntry.dir) {
    try {
      const raw = await mcmetaEntry.async("text")
      const parsed = JSON.parse(raw)
      const desc = parsed?.pack?.description
      if (typeof desc === "string") {
        description = desc
      }
    } catch {}
  }

  let iconDataUrl: string | null = null
  const pngEntry = zip.files["pack.png"]
  if (pngEntry && !pngEntry.dir) {
    try {
      const blob = await pngEntry.async("blob")
      iconDataUrl = URL.createObjectURL(blob)
    } catch {}
  }

  const files: PackFile[] = []

  const entries = zip.filter((_path, zipEntry) => !zipEntry.dir)

  for (const entry of entries) {
    const relativePath = entry.name
    if (shouldIgnore(relativePath)) continue

    const data = await entry.async("uint8array")
    files.push({ path: relativePath, data })
  }

  return {
    id: generateId(),
    name: file.name.replace(/\.zip$/i, ""),
    fileCount: files.length,
    files,
    description,
    iconDataUrl,
  }
}

export function detectConflicts(packs: TexturePack[]): Conflict[] {
  const pathMap = new Map<string, { packId: string; packName: string }[]>()

  for (const pack of packs) {
    for (const file of pack.files) {
      const existing = pathMap.get(file.path)
      if (existing) {
        existing.push({ packId: pack.id, packName: pack.name })
      } else {
        pathMap.set(file.path, [{ packId: pack.id, packName: pack.name }])
      }
    }
  }

  const conflicts: Conflict[] = []

  for (const [filePath, sources] of pathMap) {
    if (sources.length > 1) {
      conflicts.push({
        filePath,
        sources,
        chosenPackId: sources[0].packId,
      })
    }
  }

  return conflicts.sort((a, b) => a.filePath.localeCompare(b.filePath))
}

export function buildFileTree(
  packs: TexturePack[],
  prioritizedIds: string[]
): { path: string; chosenPack: string; packs: string[] }[] {
  const pathMap = new Map<
    string,
    { packName: string; packId: string }[]
  >()

  for (const pack of packs) {
    for (const file of pack.files) {
      const existing = pathMap.get(file.path)
      if (existing) {
        existing.push({ packName: pack.name, packId: pack.id })
      } else {
        pathMap.set(file.path, [{ packName: pack.name, packId: pack.id }])
      }
    }
  }

  const priorityMap = new Map<string, number>()
  prioritizedIds.forEach((id, index) => priorityMap.set(id, index))

  const result = []

  for (const [path, sources] of pathMap) {
    sources.sort(
      (a, b) =>
        (priorityMap.get(a.packId) ?? 0) - (priorityMap.get(b.packId) ?? 0)
    )
    result.push({
      path,
      chosenPack: sources[0].packName,
      packs: sources.map((s) => s.packName),
    })
  }

  return result.sort((a, b) => a.path.localeCompare(b.path))
}

export interface FolderNode {
  name: string
  type: "folder"
  children: TreeNode[]
}

export interface FileNode {
  name: string
  type: "file"
  path: string
  chosenPack: string
  packs: string[]
  isConflict: boolean
}

export type TreeNode = FolderNode | FileNode

export function buildTree(
  entries: { path: string; chosenPack: string; packs: string[] }[]
): TreeNode[] {
  const root: TreeNode[] = []

  for (const entry of entries) {
    const parts = entry.path.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      if (isLast) {
        current.push({
          name: part,
          type: "file",
          path: entry.path,
          chosenPack: entry.chosenPack,
          packs: entry.packs,
          isConflict: entry.packs.length > 1,
        })
      } else {
        let existing = current.find(
          (n): n is FolderNode =>
            n.type === "folder" && n.name === part
        )
        if (!existing) {
          existing = { name: part, type: "folder", children: [] }
          current.push(existing)
        }
        current = existing.children
      }
    }
  }

  return root
}

export async function mergePacks(
  packs: TexturePack[],
  resolutions: Map<string, string>,
  outputMeta: { name: string; description: string; iconDataUrl: string | null },
  onProgress?: (progress: MergeProgress) => void
): Promise<Blob> {
  const zip = new JSZip()

  const prioritizedFileMap = new Map<string, PackFile>()
  const resolvedPaths = new Set<string>()

  const priorityOrder = packs.map((p) => p.id)

  for (const packId of priorityOrder) {
    const pack = packs.find((p) => p.id === packId)
    if (!pack) continue

    for (const file of pack.files) {
      const resolution = resolutions.get(file.path)
      const chosenPackId = resolution ?? packId

      if (chosenPackId === packId && !prioritizedFileMap.has(file.path)) {
        prioritizedFileMap.set(file.path, file)
        resolvedPaths.add(file.path)
      }
    }
  }

  const mcmetaJson = JSON.stringify(
    {
      pack: {
        pack_format: 22,
        description: outputMeta.description || "Merged texture pack",
      },
    },
    null,
    2
  )
  zip.file("pack.mcmeta", mcmetaJson)

  if (outputMeta.iconDataUrl) {
    try {
      const response = await fetch(outputMeta.iconDataUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      zip.file("pack.png", new Uint8Array(buffer), { binary: true })
    } catch {}
  }

  const entries = Array.from(prioritizedFileMap.entries())
  const total = entries.length

  for (let i = 0; i < entries.length; i++) {
    const [path, file] = entries[i]

    zip.file(path, file.data, { binary: true })

    onProgress?.({
      current: i + 1,
      total,
      phase: "merging",
    })
  }

  onProgress?.({ current: total, total, phase: "done" })

  const blob = await zip.generateAsync({ type: "blob" })
  return blob
}
