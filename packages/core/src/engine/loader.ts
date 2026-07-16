import JSZip from "jszip"
import type { TexturePack, PackFile, PackSource } from "../types.ts"

export function generateId(): string {
  return crypto.randomUUID()
}

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

export async function loadPackFromFile(file: File): Promise<TexturePack> {
  const arrayBuffer = await file.arrayBuffer()
  return loadPackFromBuffer(arrayBuffer, file.name.replace(/\.zip$/i, ""))
}

export async function loadPackFromUrl(url: string): Promise<TexturePack> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch pack from URL: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const name = url.split("/").pop()?.replace(/\.zip$/i, "") || "remote-pack"
  return loadPackFromBuffer(arrayBuffer, name)
}

export async function loadPackFromBuffer(
  buffer: ArrayBuffer,
  name: string
): Promise<TexturePack> {
  const zip = await JSZip.loadAsync(buffer)

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
    name,
    fileCount: files.length,
    files,
    description,
    iconDataUrl,
  }
}

export async function loadPack(source: PackSource): Promise<TexturePack> {
  if (source.type === "url" && source.url) {
    return loadPackFromUrl(source.url)
  }
  if (source.type === "upload" && source.data) {
    return loadPackFromBuffer(source.data, source.id ?? "uploaded-pack")
  }
  throw new Error(`Invalid pack source: ${JSON.stringify(source)}`)
}
