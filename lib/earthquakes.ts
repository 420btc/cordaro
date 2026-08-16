import type { Earthquake } from './types'
import { formatUtc } from './types'

export async function fetchEarthquakes(day: Date): Promise<Earthquake[]> {
  const start = day.toISOString()
  const end = new Date(day.getTime() + 86400000).toISOString()
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&minmagnitude=4&orderby=time`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`USGS ${response.status}`)
    const payload = await response.json() as { features?: Array<{ id: string; properties: { mag: number; place: string; time: number }; geometry: { coordinates: [number, number, number] } }> }
    return (payload.features ?? []).map((feature) => ({ id: feature.id, time: formatUtc(new Date(feature.properties.time)), timestamp: feature.properties.time, longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1], depth: feature.geometry.coordinates[2], magnitude: feature.properties.mag, place: feature.properties.place }))
  } catch {
    return []
  }
}
