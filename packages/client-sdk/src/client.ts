import type {
  PackMergeClientConfig,
  MergeRequest,
  MergeResponse,
  MergeStatusResponse,
  PackUploadResponse,
  ApiResponse,
} from "./types.ts"

export class PackMergeClient {
  private baseUrl: string
  private apiKey?: string

  constructor(config: PackMergeClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "")
    this.apiKey = config.apiKey
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (this.apiKey) {
      h["Authorization"] = `Bearer ${this.apiKey}`
    }
    return h
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })

    const json: ApiResponse<T> = await res.json()

    if (!json.success) {
      throw new Error(json.error.message)
    }

    return json.data
  }

  async merge(req: MergeRequest): Promise<MergeResponse> {
    return this.request<MergeResponse>("POST", "/api/merge", req)
  }

  async getMergeStatus(id: string): Promise<MergeStatusResponse> {
    return this.request<MergeStatusResponse>("GET", `/api/merge/${id}`)
  }

  async uploadPack(url: string): Promise<PackUploadResponse> {
    return this.request<PackUploadResponse>("POST", "/api/packs", { url })
  }

  async updateMetadata(
    id: string,
    metadata: { description?: string; packFormat?: number }
  ): Promise<{ id: string; updated: boolean; metadata: typeof metadata }> {
    return this.request("PUT", `/api/merge/${id}/metadata`, metadata)
  }

  async resolveConflicts(
    id: string,
    resolutions: Record<string, string>
  ): Promise<{ id: string; resolved: boolean; resolutionCount: number }> {
    return this.request("POST", `/api/merge/${id}/resolve`, { resolutions })
  }

  getDownloadUrl(id: string): string {
    return `${this.baseUrl}/api/merge/${id}/download`
  }

  async deleteMerge(id: string): Promise<{ deleted: boolean }> {
    return this.request("DELETE", `/api/merge/${id}`)
  }

  async listPlugins(): Promise<{ plugins: { name: string; version: string }[] }> {
    return this.request("GET", "/api/plugins")
  }
}
