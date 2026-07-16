import { useCallback, useRef, useState } from "react"
import { Upload } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface PackUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function PackUploader({ onFilesSelected, disabled }: PackUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
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

  return (
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
  )
}
