import JSZip from "jszip"
import type { PackValidation } from "../types.ts"

export async function validatePackBuffer(
  buffer: ArrayBuffer,
  fileName: string
): Promise<PackValidation> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    return validateZip(zip, fileName)
  } catch (err) {
    return {
      valid: false,
      error: `Could not read the zip file: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function validatePack(file: File): Promise<PackValidation> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    return validateZip(zip, file.name)
  } catch (err) {
    return {
      valid: false,
      error: `Could not read the zip file: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

async function validateZip(
  zip: JSZip,
  fileName: string
): Promise<PackValidation> {
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
        "No `pack.mcmeta` found in the pack root. Minecraft resource packs require a `pack.mcmeta` file.",
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
      error: "`pack.mcmeta` is not valid JSON.",
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
        "`pack.mcmeta` must have a `\"pack\"` object at the top level.",
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
        "`pack.mcmeta` is missing `pack_format` (or `min_format` for 1.21.9+).",
    }
  }

  const hasMaxFormat =
    "max_format" in packSection &&
    typeof packSection.max_format === "number"

  if (hasMinFormat && !hasMaxFormat) {
    return {
      valid: false,
      error:
        "`pack.mcmeta` has `min_format` but is missing `max_format`.",
    }
  }

  if (!("description" in packSection)) {
    return {
      valid: false,
      error:
        "`pack.mcmeta` is missing a `description` field.",
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
        "No `assets/` folder found. Resource packs must contain an `assets/` directory.",
    }
  }

  const assetFilesUnderAssets = paths.filter(
    (p) => p.startsWith("assets/") && !zip.files[p].dir
  )
  if (assetFilesUnderAssets.length === 0) {
    return {
      valid: false,
      error:
        "The `assets/` folder is empty.",
    }
  }

  const packName =
    (packSection.description as string) ||
    fileName.replace(/\.zip$/i, "")

  return { valid: true, packName }
}
