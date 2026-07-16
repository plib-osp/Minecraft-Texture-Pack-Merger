export interface PackFile {
  path: string
  data: Uint8Array
}

export interface TexturePack {
  id: string
  name: string
  fileCount: number
  files: PackFile[]
  description: string
  iconDataUrl: string | null
}

export interface Conflict {
  filePath: string
  sources: { packId: string; packName: string }[]
  chosenPackId: string
}

export interface PackValidation {
  valid: boolean
  error?: string
  packName?: string
}

export interface MergeProgress {
  current: number
  total: number
  phase: "reading" | "resolving" | "merging" | "done" | "idle"
}
