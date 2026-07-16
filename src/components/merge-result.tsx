import { useState, useCallback } from "react"
import { Download, Spinner } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { mergePacks } from "@/lib/pack-merger"
import type { TexturePack, MergeProgress } from "@/lib/types"

interface MergeResultProps {
  packs: TexturePack[]
  resolutions: Map<string, string>
  priorityIds: string[]
  outputMeta: { name: string; description: string; iconDataUrl: string | null }
}

export function MergeResult({
  packs,
  resolutions,
  priorityIds,
  outputMeta,
}: MergeResultProps) {
  const [progress, setProgress] = useState<MergeProgress>({
    current: 0,
    total: 0,
    phase: "idle",
  })
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMerge = useCallback(async () => {
    setError(null)
    setBlobUrl(null)
    setProgress({ current: 0, total: 0, phase: "resolving" })

    try {
      const sortedPacks = priorityIds
        .map((id) => packs.find((p) => p.id === id))
        .filter((p): p is TexturePack => p !== undefined)

      const blob = await mergePacks(sortedPacks, resolutions, { ...outputMeta, packFormat: 22 }, setProgress)
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed")
      setProgress({ current: 0, total: 0, phase: "idle" })
    }
  }, [packs, resolutions, priorityIds, outputMeta])

  const isBusy = progress.phase === "merging" || progress.phase === "resolving"
  const isDone = progress.phase === "done"

  return (
    <div className="space-y-3">
      {!isDone && (
        <Button
          onClick={handleMerge}
          disabled={isBusy}
          className="w-full"
          size="lg"
        >
          {isBusy ? (
            <>
              <Spinner className="animate-spin" />
              Merging...
            </>
          ) : (
            <>
              <Download />
              Merge & Download
            </>
          )}
        </Button>
      )}

      {isBusy && progress.total > 0 && (
        <Progress
          value={(progress.current / progress.total) * 100}
          className="w-full"
        />
      )}

      {isDone && blobUrl && (
        <div className="space-y-2">
          <Alert>
            <AlertDescription>
              Merge complete! Your pack is ready.
            </AlertDescription>
          </Alert>
          <a
            href={blobUrl}
            download={`${outputMeta.name || "merged-texture-pack"}.zip`}
            onClick={() => {
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl!)
                setBlobUrl(null)
                setProgress({ current: 0, total: 0, phase: "idle" })
              }, 1000)
            }}
          >
            <Button variant="default" className="w-full" size="lg">
              <Download />
              Download {outputMeta.name || "merged-texture-pack"}.zip
            </Button>
          </a>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
