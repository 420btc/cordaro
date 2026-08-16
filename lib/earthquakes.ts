import type { Earthquake } from './types'
import { formatUtc } from './types'

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Devuelve el sismo más cercano dentro de un radio (por defecto 100 km).
export function nearestQuakeWithin(latitude: number, longitude: number, quakes: Earthquake[], radiusKm = 100): { quake: Earthquake; distanceKm: number } | null {
  let best: { quake: Earthquake; distanceKm: number } | null = null
  for (const quake of quakes) {
    const distanceKm = haversineKm(latitude, longitude, quake.latitude, quake.longitude)
    if (distanceKm <= radiusKm && (!best || distanceKm < best.distanceKm)) {
      best = { quake, distanceKm }
    }
  }
  return best
}

async function queryUsgs(start: Date, end: Date): Promise<Earthquake[]> {
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start.toISOString()}&endtime=${end.toISOString()}&minmagnitude=4&orderby=time`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`USGS ${response.status}`)
    const payload = await response.json() as { features?: Array<{ id: string; properties: { mag: number; place: string; time: number }; geometry: { coordinates: [number, number, number] } }> }
    return (payload.features ?? []).map((feature) => ({ id: feature.id, time: formatUtc(new Date(feature.properties.time)), timestamp: feature.properties.time, longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1], depth: feature.geometry.coordinates[2], magnitude: feature.properties.mag, place: feature.properties.place }))
  } catch {
    return []
  }
}

export function fetchEarthquakes(day: Date): Promise<Earthquake[]> {
  return queryUsgs(day, new Date(day.getTime() + 86400000))
}

export function fetchEarthquakesRange(start: Date, end: Date): Promise<Earthquake[]> {
  return queryUsgs(start, end)
}
