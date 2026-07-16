import { useCallback, useRef, useState } from "react"
import { Upload, Link, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { loadPackFromUrl } from "@pack-merge/core"
import type { TexturePack } from "@pack-merge/core"

interface PackUploaderProps {
  onFilesSelected: (files: File[]) => void
  onUrlPackLoaded?: (pack: TexturePack) => void
  disabled?: boolean
}

export function PackUploader({ onFilesSelected, onUrlPackLoaded, disabled }: PackUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const zips = Array.from(fileList).filter(
        (f) =>
          f.name.endsWith(".zip") || f.type === "application/zip"
      )
      if (zips.length > 0) {
        onFilesSelected(zips)
      }
    },
    [onFilesSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleUrlLoad = useCallback(async () => {
    const url = urlInput.trim()
    if (!url) return

    setUrlLoading(true)
    setUrlError(null)

    try {
      const pack = await loadPackFromUrl(url)
      onUrlPackLoaded?.(pack)
      setUrlInput("")
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to load pack from URL")
    } finally {
      setUrlLoading(false)
    }
  }, [urlInput, onUrlPackLoaded])

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleUrlLoad()
      }
    },
    [handleUrlLoad]
  )

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mb-4 rounded-full bg-muted p-3">
          <Upload className="size-6 text-muted-foreground" />
        </div>
        <p className="mb-1 text-sm font-medium">
          Drop Minecraft texture packs here
        </p>
        <p className="text-xs text-muted-foreground">
           Supports .zip files, multiple packs at once
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or load from URL</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com/pack.zip"
            disabled={disabled || urlLoading}
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleUrlLoad}
          disabled={disabled || urlLoading || !urlInput.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {urlLoading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "Load"
          )}
        </button>
      </div>

      {urlError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="size-4 shrink-0" />
          <span>{urlError}</span>
          <button
            onClick={() => setUrlError(null)}
            className="ml-auto rounded p-0.5 transition-colors hover:bg-destructive/20"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}
