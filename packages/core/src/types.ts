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

export interface McmetaPack {
  pack_format?: number
  min_format?: number
  max_format?: number
  description: string | Record<string, unknown>
}

export interface McmetaData {
  pack: McmetaPack
  [key: string]: unknown
}

export interface OutputMetadata {
  name: string
  description: string
  packFormat: number
  iconDataUrl: string | null
}

export interface MergeConfig {
  packs: TexturePack[]
  priority: string[]
  resolutions: Map<string, string>
  output: OutputMetadata
  autoResolve?: boolean
}

export interface PackSource {
  type: "upload" | "url"
  id?: string
  url?: string
  data?: ArrayBuffer
}

export interface MergeJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: MergeProgress
  config: MergeConfig
  conflicts: Conflict[]
  resultBlob?: Blob
  error?: string
  createdAt: number
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

export interface BeforeMergeContext {
  packs: TexturePack[]
  priority: string[]
  resolutions: Map<string, string>
  output: OutputMetadata
}

export interface AfterMergeContext {
  packs: TexturePack[]
  output: OutputMetadata
  blob: Blob
  duration: number
}

export interface ConflictContext {
  conflicts: Conflict[]
  packs: TexturePack[]
  autoResolve: boolean
  overrides?: Record<string, string>
}

export interface ValidateContext {
  pack: TexturePack
  source: PackSource
  errors: string[]
  warnings: string[]
}

export interface MetadataContext {
  metadata: OutputMetadata
  packs: TexturePack[]
}

export interface WriteContext {
  files: PackFile[]
  output: OutputMetadata
}
