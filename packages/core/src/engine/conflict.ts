import type { TexturePack, Conflict, FolderNode, TreeNode } from "../types.ts"

export function detectConflicts(packs: TexturePack[]): Conflict[] {
  const pathMap = new Map<string, { packId: string; packName: string }[]>()

  for (const pack of packs) {
    for (const file of pack.files) {
      const existing = pathMap.get(file.path)
      if (existing) {
        existing.push({ packId: pack.id, packName: pack.name })
      } else {
        pathMap.set(file.path, [{ packId: pack.id, packName: pack.name }])
      }
    }
  }

  const conflicts: Conflict[] = []
  for (const [filePath, sources] of pathMap) {
    if (sources.length > 1) {
      conflicts.push({
        filePath,
        sources,
        chosenPackId: sources[0].packId,
      })
    }
  }

  return conflicts.sort((a, b) => a.filePath.localeCompare(b.filePath))
}

export function buildFileTree(
  packs: TexturePack[],
  prioritizedIds: string[]
): { path: string; chosenPack: string; packs: string[] }[] {
  const pathMap = new Map<string, { packName: string; packId: string }[]>()

  for (const pack of packs) {
    for (const file of pack.files) {
      const existing = pathMap.get(file.path)
      if (existing) {
        existing.push({ packName: pack.name, packId: pack.id })
      } else {
        pathMap.set(file.path, [{ packName: pack.name, packId: pack.id }])
      }
    }
  }

  const priorityMap = new Map<string, number>()
  prioritizedIds.forEach((id, index) => priorityMap.set(id, index))

  const result = []
  for (const [path, sources] of pathMap) {
    sources.sort(
      (a, b) =>
        (priorityMap.get(a.packId) ?? 0) - (priorityMap.get(b.packId) ?? 0)
    )
    result.push({
      path,
      chosenPack: sources[0].packName,
      packs: sources.map((s) => s.packName),
    })
  }

  return result.sort((a, b) => a.path.localeCompare(b.path))
}

export function buildTree(
  entries: { path: string; chosenPack: string; packs: string[] }[]
): TreeNode[] {
  const root: TreeNode[] = []

  for (const entry of entries) {
    const parts = entry.path.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      if (isLast) {
        current.push({
          name: part,
          type: "file",
          path: entry.path,
          chosenPack: entry.chosenPack,
          packs: entry.packs,
          isConflict: entry.packs.length > 1,
        })
      } else {
        let existing = current.find(
          (n): n is FolderNode =>
            n.type === "folder" && n.name === part
        )
        if (!existing) {
          existing = { name: part, type: "folder", children: [] }
          current.push(existing)
        }
        current = existing.children
      }
    }
  }

  return root
}
