// Caché en memoria (por instancia) para los proxies de datos externos.
// Reduce el número de peticiones aguas arriba (NOAA/USGS/IGN/BMKG/sos70...) sin
// cambiar la frescura: cada ruta usa el mismo TTL que ya devolvía en Cache-Control.

type Entry = { data: unknown; at: number }

const store = new Map<string, Entry>()

export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > ttlMs) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, at: Date.now() })
  if (store.size > 500) {
    const oldest = store.keys().next().value
    if (oldest !== undefined) store.delete(oldest)
  }
}
