import { useRef, useState, useCallback, useEffect } from "react"
import { PackCard } from "./pack-card"
import { cn } from "@/lib/utils"
import type { TexturePack } from "@/lib/types"

interface PriorityListProps {
  packs: TexturePack[]
  conflictsPerPack: Map<string, number>
  onReorder: (packs: TexturePack[]) => void
  onRemove: (id: string) => void
}

interface DragState {
  from: number
  to: number
  startY: number
  currentY: number
}

export function PriorityList({
  packs,
  conflictsPerPack,
  onReorder,
  onRemove,
}: PriorityListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const slotCenters = useRef<number[]>([])

  const [dragState, setDragState] = useState<DragState | null>(null)

  useEffect(() => {
    const els = cardRefs.current.map((el) =>
      el ? el.getBoundingClientRect() : null
    )
    slotCenters.current = []
    for (let i = 0; i < els.length; i++) {
      const r = els[i]
      if (!r) continue
      slotCenters.current.push(r.top + r.height / 2)
    }
  }, [packs.length])

  const getTargetIndex = useCallback(
    (clientY: number): number => {
      const centers = slotCenters.current
      if (centers.length === 0) return dragState?.from ?? 0
      let closest = dragState?.from ?? 0
      let minDist = Infinity
      for (let i = 0; i < centers.length; i++) {
        const dist = Math.abs(clientY - centers[i])
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      }
      return closest
    },
    [dragState]
  )

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      setDragState({
        from: index,
        to: index,
        startY: e.clientY,
        currentY: e.clientY,
      })
    },
    []
  )

  const containerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return
      const to = getTargetIndex(e.clientY)
      if (to !== dragState.to) {
        setDragState({ ...dragState, to, currentY: e.clientY })
      } else {
        setDragState({ ...dragState, currentY: e.clientY })
      }
    },
    [dragState, getTargetIndex]
  )

  const containerPointerUp = useCallback(
    () => {
      if (!dragState) return
      if (dragState.to !== dragState.from) {
        const newPacks = [...packs]
        const [removed] = newPacks.splice(dragState.from, 1)
        newPacks.splice(dragState.to, 0, removed)
        onReorder(newPacks)
      }
      setDragState(null)
    },
    [dragState, packs, onReorder]
  )

  if (packs.length === 0) return null

  const draggedPackId =
    dragState ? packs[dragState.from].id : null

  const cardH =
    cardRefs.current
      .map((el) => el?.getBoundingClientRect().height ?? 0)
      .filter(Boolean)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Texture Packs ({packs.length})
        </h3>
        <p className="text-xs text-muted-foreground">
           Drag the grip handle to reorder, top wins on conflicts
        </p>
      </div>
      <div
        ref={containerRef}
        className="space-y-2"
        onPointerMove={containerPointerMove}
        onPointerUp={containerPointerUp}
      >
        {packs.map((pack, index) => {
          const isDragging = draggedPackId === pack.id
          let offset: number | undefined

          if (dragState && !isDragging) {
            const h = cardH[dragState.from] ?? 0
            if (index > dragState.from && index <= dragState.to) {
              offset = -h - 8
            } else if (index < dragState.from && index >= dragState.to) {
              offset = h + 8
            }
          }

          return (
            <div
              key={pack.id}
              className={cn(
                "transition-transform duration-200 ease-out",
                offset !== undefined && "pointer-events-none"
              )}
              style={
                offset !== undefined
                  ? { transform: `translateY(${offset}px)` }
                  : undefined
              }
            >
              <PackCard
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                pack={pack}
                index={index}
                isFirst={index === 0}
                onRemove={() => onRemove(pack.id)}
                conflictCount={conflictsPerPack.get(pack.id)}
                isDragging={isDragging}
                dragOffset={
                  isDragging && dragState
                    ? dragState.currentY - dragState.startY
                    : undefined
                }
                onDragStart={(e) => handlePointerDown(index, e)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
