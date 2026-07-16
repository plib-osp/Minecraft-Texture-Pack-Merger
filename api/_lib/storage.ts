const store = new Map<string, { data: ArrayBuffer; name: string; createdAt: number }>()

const TTL = 1000 * 60 * 60 // 1 hour

export async function storeBuffer(
  id: string,
  data: ArrayBuffer,
  name: string
): Promise<void> {
  store.set(id, { data, name, createdAt: Date.now() })
}

export async function getBuffer(id: string): Promise<ArrayBuffer | null> {
  const entry = store.get(id)
  if (!entry) return null
  if (Date.now() - entry.createdAt > TTL) {
    store.delete(id)
    return null
  }
  return entry.data
}

export async function deleteBuffer(id: string): Promise<void> {
  store.delete(id)
}

export async function cleanup(): Promise<number> {
  const now = Date.now()
  let count = 0
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL) {
      store.delete(id)
      count++
    }
  }
  return count
}

setInterval(cleanup, 1000 * 60 * 5)
