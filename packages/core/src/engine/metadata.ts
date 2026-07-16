import type { OutputMetadata, TexturePack } from "../types.ts"

export function generateMcmeta(
  output: OutputMetadata,
  _packs?: TexturePack[]
): string {
  const mcmeta = {
    pack: {
      pack_format: output.packFormat,
      description: output.description || "Merged texture pack",
    },
  }
  return JSON.stringify(mcmeta, null, 2)
}

export function updateMcmeta(
  existingJson: string,
  updates: Partial<OutputMetadata>
): string {
  try {
    const parsed = JSON.parse(existingJson)
    if (!parsed.pack) parsed.pack = {}

    if (updates.description !== undefined) {
      parsed.pack.description = updates.description
    }
    if (updates.packFormat !== undefined) {
      parsed.pack.pack_format = updates.packFormat
    }

    return JSON.stringify(parsed, null, 2)
  } catch {
    return existingJson
  }
}

export function parseMcmeta(raw: string): OutputMetadata {
  const parsed = JSON.parse(raw)
  const pack = parsed?.pack ?? {}
  return {
    name: "",
    description: pack.description ?? "",
    packFormat: pack.pack_format ?? 22,
    iconDataUrl: null,
  }
}
