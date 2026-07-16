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

function getCleanNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const filename = urlObj.pathname.split("/").pop() || ""
    return decodeURIComponent(filename.replace(/\.zip$/i, ""))
  } catch {
    const rawName = url.split("/").pop()?.replace(/\.zip$/i, "") || "remote-pack"
    return rawName.split("?")[0]
  }
}

function extractComponentText(comp: unknown): string {
  if (typeof comp === "string") return comp
  if (comp && typeof comp === "object") {
    const obj = comp as Record<string, unknown>
    if (typeof obj.text === "string") return obj.text
    if (typeof obj.translate === "string") return obj.translate
  }
  return ""
}

function serializeDescription(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    const desc = parsed?.pack?.description
    if (!desc) return ""
    if (typeof desc === "string") return desc

    if (Array.isArray(desc)) {
      return desc.map(extractComponentText).filter(Boolean).join(" ")
    }

    if (typeof desc === "object") {
      return extractComponentText(desc)
    }

    return ""
  } catch {
    return ""
  }
}

function extractNameFromMcmeta(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw)
    const desc = parsed?.pack?.description
    if (!desc) return null

    if (typeof desc === "string") {
      return desc.replace(/§[0-9a-fk-or]/g, "").trim()
    }

    if (Array.isArray(desc)) {
      return desc.map(extractComponentText).filter(Boolean).join(" ").trim()
    }

    if (typeof desc === "object" && desc !== null) {
      return extractComponentText(desc)
    }

    return null
  } catch {
    return null
  }
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
  const name = getCleanNameFromUrl(url)
  return loadPackFromBuffer(arrayBuffer, name)
}

export async function loadPackFromBuffer(
  buffer: ArrayBuffer,
  name: string
): Promise<TexturePack> {
  const zip = await JSZip.loadAsync(buffer)

  let description = ""
  let nameFromMeta: string | null = null
  const mcmetaEntry = zip.files["pack.mcmeta"]
  if (mcmetaEntry && !mcmetaEntry.dir) {
    try {
      const raw = await mcmetaEntry.async("text")
      description = serializeDescription(raw)
      nameFromMeta = extractNameFromMcmeta(raw)
    } catch {}
  }

  if (nameFromMeta) {
    name = nameFromMeta
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
