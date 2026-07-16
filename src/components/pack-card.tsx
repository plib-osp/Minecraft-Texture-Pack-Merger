import { forwardRef } from "react"
import {
  DotsSixVertical,
  X,
  FileText,
  ImageSquare,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TexturePack } from "@/lib/types"

interface PackCardProps {
  pack: TexturePack
  index: number
  isFirst: boolean
  onRemove: () => void
  conflictCount?: number
  isDragging?: boolean
  dragOffset?: number
  onDragStart: (e: React.PointerEvent) => void
}

export const PackCard = forwardRef<HTMLDivElement, PackCardProps>(
  function PackCard(
    {
      pack,
      index,
      isFirst,
      onRemove,
      conflictCount,
      isDragging,
      dragOffset,
      onDragStart,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center gap-3 rounded-lg border p-3 transition-colors",
          index === 0 && "border-primary/50 bg-primary/5",
          isDragging && "z-10 opacity-60"
        )}
        style={
          isDragging && dragOffset !== undefined
            ? { transform: `translateY(${dragOffset}px)`, transition: "transform 50ms linear" }
            : undefined
        }
      >
        <div
          onPointerDown={onDragStart}
          className="cursor-grab touch-none rounded p-0.5 active:cursor-grabbing hover:bg-muted"
        >
          <DotsSixVertical className="size-4 text-muted-foreground" />
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {pack.iconDataUrl ? (
            <img
              src={pack.iconDataUrl}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImageSquare className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{pack.name}</span>
            {isFirst && (
              <Badge variant="default" className="shrink-0 text-[10px]">
                Priority
              </Badge>
            )}
          </div>
          {pack.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {pack.description}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              {pack.fileCount} files
            </span>
            {conflictCount !== undefined && conflictCount > 0 && (
              <span className="text-destructive">{conflictCount} conflicts</span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-foreground hover:text-foreground"
          onClick={onRemove}
          aria-label="Remove pack"
        >
          <X className="size-4" weight="bold" />
        </Button>
      </div>
    )
  }
)