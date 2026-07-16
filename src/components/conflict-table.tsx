import { useMemo } from "react"
import { Warning } from "@phosphor-icons/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { detectConflicts } from "@/lib/pack-merger"
import type { TexturePack } from "@/lib/types"

interface ConflictTableProps {
  packs: TexturePack[]
  prioritizedIds: string[]
  resolutions: Map<string, string>
  onResolve: (filePath: string, chosenPackId: string) => void
}

export function ConflictTable({
  packs,
  resolutions,
  onResolve,
}: ConflictTableProps) {
  const conflicts = useMemo(
    () => detectConflicts(packs),
    [packs]
  )

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Warning className="size-8" />
        <p className="text-sm">No conflicts found</p>
        <p className="text-xs">
          All files are unique across your texture packs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          Conflicting Files
          <Badge variant="destructive">{conflicts.length}</Badge>
        </h3>
        <p className="text-xs text-muted-foreground">
          Select which pack to use for each file
        </p>
      </div>
      <ScrollArea className="h-[400px] rounded-md border">
        <div className="divide-y">
          {conflicts.map((conflict) => {
            const resolvedId =
              resolutions.get(conflict.filePath) ?? conflict.chosenPackId

            return (
              <div
                key={conflict.filePath}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {conflict.filePath}
                </span>
                <Select
                  value={resolvedId}
                  onValueChange={(value) => {
                    if (value) onResolve(conflict.filePath, value);
                  }}
                >
                  <SelectTrigger className="w-[200px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conflict.sources.map((source) => (
                      <SelectItem key={source.packId} value={source.packId}>
                        {source.packName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
