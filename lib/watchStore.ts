export type WatchedCrossing = {
  id: string
  time: string
  timestamp: number
  latitude: number
  longitude: number
  type: 'moon' | 'antipode'
  plateA: string
  color: string
  result: { magnitude: number; distanceKm: number; place: string } | null
  savedAt: number
}

const KEY = 'watched-crossings-v1'
const MAX_ITEMS = 40

export function loadWatched(): WatchedCrossing[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WatchedCrossing[]) : []
  } catch {
    return []
  }
}

function saveWatched(items: WatchedCrossing[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // localStorage lleno o bloqueado; se ignora.
  }
}

export function addWatched(item: WatchedCrossing): WatchedCrossing[] {
  const items = loadWatched().filter((x) => x.id !== item.id || x.savedAt !== item.savedAt)
  items.unshift(item)
  const trimmed = items.slice(0, MAX_ITEMS)
  saveWatched(trimmed)
  return trimmed
}

export function clearWatched(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // se ignora
  }
}
