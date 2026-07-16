import { useState, useCallback } from "react"
import { Download, Spinner, FileCode, Check, Code } from "@phosphor-icons/react"
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
  apiUrl?: string
}

export function MergeResult({
  packs,
  resolutions,
  priorityIds,
  outputMeta,
  apiUrl,
}: MergeResultProps) {
  const [progress, setProgress] = useState<MergeProgress>({
    current: 0,
    total: 0,
    phase: "idle",
  })
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleExportConfig = useCallback(() => {
    const config = {
      packs: packs.map((p) => ({
        name: p.name,
        description: p.description,
        fileCount: p.fileCount,
      })),
      priority: priorityIds,
      output: {
        name: outputMeta.name,
        description: outputMeta.description,
        packFormat: 22,
      },
      resolutions: Object.fromEntries(resolutions),
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${outputMeta.name || "merge-config"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [packs, priorityIds, outputMeta, resolutions])

  const handleCopyCurl = useCallback(() => {
    if (!apiUrl) return

    const curlCommand = [
      'curl -X POST ' + apiUrl + '/api/merge \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '" + JSON.stringify({
        packs: packs.map((p) => ({
          type: "url",
          url: "https://example.com/" + p.name + ".zip",
        })),
        priority: packs.map((_, i) => "pack" + (i + 1)),
        output: {
          name: outputMeta.name,
          description: outputMeta.description,
        },
      }, null, 2) + "'",
    ].join("\n")

    navigator.clipboard.writeText(curlCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [apiUrl, packs, outputMeta])

  const isBusy = progress.phase === "merging" || progress.phase === "resolving"
  const isDone = progress.phase === "done"

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!isDone && (
          <Button
            onClick={handleMerge}
            disabled={isBusy}
            className="flex-1"
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

        <Button
          onClick={handleExportConfig}
          variant="outline"
          size="lg"
          title="Export config as JSON"
        >
          <FileCode />
        </Button>

        {apiUrl && (
          <Button
            onClick={handleCopyCurl}
            variant="outline"
            size="lg"
            title="Copy cURL command for API"
          >
            {copied ? <Check /> : <Code />}
          </Button>
        )}
      </div>

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
