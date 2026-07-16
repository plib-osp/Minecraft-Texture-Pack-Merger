import { useState, useCallback } from "react"
import { PackMergeClient } from "../client.ts"
import type { MergeRequest, MergeResponse, MergeStatusResponse } from "../types.ts"

interface UsePackMergeOptions {
  apiUrl: string
  apiKey?: string
}

interface UsePackMergeState {
  job: MergeResponse | null
  status: MergeStatusResponse | null
  loading: boolean
  error: string | null
  downloadUrl: string | null
}

export function usePackMerge(options: UsePackMergeOptions) {
  const [state, setState] = useState<UsePackMergeState>({
    job: null,
    status: null,
    loading: false,
    error: null,
    downloadUrl: null,
  })

  const client = new PackMergeClient({
    baseUrl: options.apiUrl,
    apiKey: options.apiKey,
  })

  const merge = useCallback(async (req: MergeRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const job = await client.merge(req)
      setState((prev) => ({
        ...prev,
        job,
        loading: false,
        downloadUrl: client.getDownloadUrl(job.id),
      }))
      return job
    } catch (err) {
      const message = err instanceof Error ? err.message : "Merge failed"
      setState((prev) => ({ ...prev, error: message, loading: false }))
      throw err
    }
  }, [options.apiUrl, options.apiKey])

  const pollStatus = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const status = await client.getMergeStatus(id)
      setState((prev) => ({
        ...prev,
        status,
        loading: false,
        downloadUrl: status.status === "completed"
          ? client.getDownloadUrl(id)
          : prev.downloadUrl,
      }))
      return status
    } catch (err) {
      const message = err instanceof Error ? err.message : "Status check failed"
      setState((prev) => ({ ...prev, error: message, loading: false }))
      throw err
    }
  }, [options.apiUrl, options.apiKey])

  return {
    ...state,
    merge,
    pollStatus,
  }
}
