import { useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  WarningCircle,
  Package,
  Coffee,
  Robot,
  ImageSquare,
  BookOpen,
} from "@phosphor-icons/react"
import { PackUploader } from "@/components/pack-uploader"
import { PriorityList } from "@/components/priority-list"
import { ConflictTable } from "@/components/conflict-table"
import { MergeResult } from "@/components/merge-result"
import { ApiDocs } from "@/components/api-docs"
import { loadPackFromFile, detectConflicts, validatePack } from "@/lib/pack-merger"
import { cn } from "@/lib/utils"
import type { TexturePack } from "@/lib/types"

const API_URL = import.meta.env.VITE_API_URL || ""

type View = "main" | "api-docs"

export default function App() {
  const [view, setView] = useState<View>("main")
  const [packs, setPacks] = useState<TexturePack[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [resolutions, setResolutions] = useState<Map<string, string>>(
    () => new Map()
  )
  const [autoMerge, setAutoMerge] = useState(true)
  const [outputMeta, setOutputMeta] = useState({
    name: "merged-texture-pack",
    description: "",
    iconDataUrl: null as string | null,
  })

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setLoading(true)
    setErrors([])

    const validationResults = await Promise.all(files.map(validatePack))

    const existingNames = new Set(packs.map((p) => p.name))
    const validFiles: File[] = []
    const fileErrors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const name = files[i].name.replace(/\.zip$/i, "")
      const result = validationResults[i]

      if (!result.valid) {
        fileErrors.push(`"${files[i].name}": ${result.error}`)
      } else if (existingNames.has(name)) {
        fileErrors.push(`"${files[i].name}" is already loaded`)
      } else {
        validFiles.push(files[i])
      }
    }

    if (validFiles.length === 0) {
      setErrors(fileErrors)
      setLoading(false)
      return
    }

    if (fileErrors.length > 0) {
      setErrors(fileErrors)
    }

    try {
      const loaded = await Promise.all(validFiles.map(loadPackFromFile))
      setPacks((prev) => [...prev, ...loaded])
      setResolutions(new Map())
    } catch (err) {
      setErrors((prev) => [
        ...prev,
        err instanceof Error
          ? err.message
          : "Failed to load one or more texture packs",
      ])
    } finally {
      setLoading(false)
    }
  }, [packs])

  const handleUrlPackLoaded = useCallback((pack: TexturePack) => {
    setPacks((prev) => {
      if (prev.some((p) => p.name === pack.name)) {
        setErrors((prev) => [...prev, `"${pack.name}" is already loaded`])
        return prev
      }
      return [...prev, pack]
    })
    setResolutions(new Map())
  }, [])

  const handleReorder = useCallback((newPacks: TexturePack[]) => {
    setPacks(newPacks)
    setResolutions(new Map())
  }, [])

  const handleRemove = useCallback((id: string) => {
    setPacks((prev) => prev.filter((p) => p.id !== id))
    setResolutions(new Map())
  }, [])

  const handleResolve = useCallback(
    (filePath: string, chosenPackId: string) => {
      setResolutions((prev) => {
        const next = new Map(prev)
        next.set(filePath, chosenPackId)
        return next
      })
    },
    []
  )

  const prioritizedIds = packs.map((p) => p.id)
  const conflicts = packs.length > 1 ? detectConflicts(packs) : []
  const hasPacks = packs.length > 0

  const conflictsPerPack = new Map<string, number>()
  for (const c of conflicts) {
    for (const s of c.sources) {
      conflictsPerPack.set(
        s.packId,
        (conflictsPerPack.get(s.packId) ?? 0) + 1
      )
    }
  }

  if (view === "api-docs") {
    return <ApiDocs onBack={() => setView("main")} />
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-4 py-8 sm:p-8">
      <header className="text-center">
        <div className="mb-3 flex justify-center">
          <div className="rounded-xl bg-muted p-3">
            <Package className="size-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Minecraft Texture Pack Merger
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
           Merge multiple texture packs into one, resolve conflicts
          file-by-file. All processing happens in your browser.
        </p>
      </header>

      <PackUploader
        onFilesSelected={handleFilesSelected}
        onUrlPackLoaded={handleUrlPackLoaded}
        disabled={loading}
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertTitle>
            {errors.length === 1 ? "Invalid Pack" : "Invalid Packs"}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasPacks && !loading && (
        <>
          <PriorityList
            packs={packs}
            conflictsPerPack={conflictsPerPack}
            onReorder={handleReorder}
            onRemove={handleRemove}
          />

          <Separator />

          <div
            className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            onClick={() => setAutoMerge((v) => !v)}
          >
            <div className="flex items-start gap-3">
              <Robot
                className={cn(
                  "mt-0.5 size-5 transition-colors",
                  autoMerge ? "text-primary" : "text-muted-foreground"
                )}
                weight={autoMerge ? "fill" : "regular"}
              />
              <div>
                <p className="text-sm font-medium">Auto Merge</p>
                <p className="text-xs text-muted-foreground">
                  {autoMerge
                    ? "Conflicts are resolved automatically using pack priority order."
                    : "Manually choose which file wins each conflict."}
                </p>
              </div>
            </div>
            <Switch
              checked={autoMerge}
              onCheckedChange={setAutoMerge}
              aria-label="Toggle auto merge"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {autoMerge ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
              <Robot className="size-4" weight="fill" />
              <span>
                {conflicts.length > 0
                  ? `${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""} resolved automatically via priority order.`
                  : "No conflicts detected."}
              </span>
            </div>
          ) : (
            <ConflictTable
              packs={packs}
              prioritizedIds={prioritizedIds}
              resolutions={resolutions}
              onResolve={handleResolve}
            />
          )}

          <Separator />

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div
                className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-muted transition-colors hover:bg-muted/80"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/png"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setOutputMeta((prev) => ({ ...prev, iconDataUrl: url }))
                  }
                  input.click()
                }}
                title="Click to set pack icon"
              >
                {outputMeta.iconDataUrl ? (
                  <>
                    <img
                      src={outputMeta.iconDataUrl}
                      alt=""
                      className="size-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      <ImageSquare className="size-5 text-white" />
                    </div>
                  </>
                ) : (
                  <ImageSquare className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <input
                  value={outputMeta.name}
                  onChange={(e) =>
                    setOutputMeta((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-8 w-full rounded border bg-background px-2 text-sm outline-none focus:border-primary"
                  placeholder="Pack name"
                />
                <input
                  value={outputMeta.description}
                  onChange={(e) =>
                    setOutputMeta((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="h-7 w-full rounded border bg-background px-2 text-xs text-muted-foreground outline-none focus:border-primary"
                  placeholder="Pack description (optional)"
                />
              </div>
            </div>
          </div>

          <MergeResult
            packs={packs}
            resolutions={resolutions}
            priorityIds={prioritizedIds}
            outputMeta={outputMeta}
            apiUrl={API_URL || undefined}
          />
        </>
      )}

      <footer className="mt-auto space-y-2 text-center text-xs text-muted-foreground">
        <p>
          made with{" "}
          <Coffee className="inline size-3" weight="fill" /> by{" "}
          <a
            href="https://pozii.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            pozii
          </a>
        </p>
        <p>
          All processing is done in your browser. No files are uploaded to any
          server.
        </p>
        <Button
          variant="link"
          size="sm"
          onClick={() => setView("api-docs")}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="size-3.5" />
          API Documentation
        </Button>
      </footer>
    </div>
  )
}
