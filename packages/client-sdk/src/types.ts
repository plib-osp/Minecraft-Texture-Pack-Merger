export interface PackMergeClientConfig {
  baseUrl: string
  apiKey?: string
}

export interface MergeRequest {
  packs: { type: "url"; url: string }[]
  priority?: string[]
  output?: {
    name?: string
    description?: string
    packFormat?: number
    iconDataUrl?: string
  }
  autoResolve?: boolean
}

export interface MergeResponse {
  id: string
  status: string
  progress: { current: number; total: number; phase: string }
  downloadUrl: string
}

export interface MergeStatusResponse {
  id: string
  status: string
  progress: { current: number; total: number; phase: string }
  conflicts: { filePath: string; sources: { packId: string; packName: string }[] }[]
  error?: string
  downloadUrl: string
}

export interface PackUploadResponse {
  id: string
  name: string
  fileCount: number
  description: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | ApiError
