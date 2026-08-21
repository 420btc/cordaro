export type IgnQuake = {
  id: string
  date: string
  time: string
  timestamp: number
  latitude: number
  longitude: number
  depth: number
  magnitude: number
  magType: string
  intensity: string
  place: string
}

export async function fetchIgnQuakes(): Promise<IgnQuake[]> {
  const res = await fetch('/api/ign')
  if (!res.ok) throw new Error(`IGN ${res.status}`)
  const data = (await res.json()) as { quakes: IgnQuake[] }
  return data.quakes
}

// Color de la magnitud: verde (baja) → rojo (alta).
export function ignMagColor(magnitude: number): string {
  if (magnitude >= 4) return '#e5484d'
  if (magnitude >= 3) return '#d08a3a'
  if (magnitude >= 2) return '#e0a028'
  return '#6aa86f'
}
