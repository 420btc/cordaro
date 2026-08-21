export type RegionId = 'espana' | 'eeuu' | 'mexico' | 'chile' | 'indonesia'

export type RegionalQuake = {
  id: string
  timestamp: number
  date: string // YYYY-MM-DD
  time: string // HH:MM:SS
  latitude: number
  longitude: number
  depth: number
  magnitude: number
  magType: string
  intensity: string
  place: string
}

export type RegionDef = {
  id: RegionId
  latMin: number
  latMax: number
  lonMin: number
  lonMax: number
  center: [number, number]
  zoom: number
}

export const REGIONS: RegionDef[] = [
  { id: 'espana', latMin: 27, latMax: 44, lonMin: -18, lonMax: 4, center: [40, -3.7], zoom: 6 },
  { id: 'eeuu', latMin: 24, latMax: 49, lonMin: -125, lonMax: -66, center: [39.8, -98.6], zoom: 4 },
  { id: 'mexico', latMin: 14, latMax: 33, lonMin: -118, lonMax: -86, center: [23.6, -102.5], zoom: 5 },
  { id: 'chile', latMin: -56, latMax: -17, lonMin: -76, lonMax: -66, center: [-35, -71], zoom: 4 },
  { id: 'indonesia', latMin: -11, latMax: 6, lonMin: 95, lonMax: 141, center: [-2.5, 118], zoom: 4 },
]

export function regionForLocation(latitude: number, longitude: number): RegionId | null {
  for (const region of REGIONS) {
    if (latitude >= region.latMin && latitude <= region.latMax && longitude >= region.lonMin && longitude <= region.lonMax) return region.id
  }
  return null
}

export function regionById(id: RegionId): RegionDef {
  return REGIONS.find((region) => region.id === id) ?? REGIONS[0]
}

export async function fetchRegionalQuakes(region: RegionId): Promise<RegionalQuake[]> {
  const res = await fetch(`/api/seismicity?region=${region}`)
  if (!res.ok) throw new Error(`Seismicity ${res.status}`)
  const data = (await res.json()) as { quakes: RegionalQuake[] }
  return data.quakes
}

// Color de la magnitud: verde (baja) → rojo (alta).
export function magColor(magnitude: number): string {
  if (magnitude >= 4) return '#e5484d'
  if (magnitude >= 3) return '#d08a3a'
  if (magnitude >= 2) return '#e0a028'
  return '#6aa86f'
}
