import { calculateMoonPath } from './astronomy'
import { detectPlateCrossings } from './plates'
import { fetchEarthquakesRange, nearestQuakeWithin } from './earthquakes'
import { dateKey, type Earthquake } from './types'

// Calcula cuántas coincidencias (cruce validado por un sismo real a ≤ 100 km)
// hubo en cada uno de los últimos `daysBack` días. Devuelve { 'yyyy-MM-dd': count }.
export async function computeCoincidences(daysBack = 15): Promise<Record<string, number>> {
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(todayUtc.getTime() - (daysBack - 1) * 86400000)
  const end = new Date(todayUtc.getTime() + 86400000 - 1)

  const quakes = await fetchEarthquakesRange(start, end)
  const byDay: Record<string, Earthquake[]> = {}
  for (const quake of quakes) {
    const key = dateKey(new Date(quake.timestamp))
    ;(byDay[key] ??= []).push(quake)
  }

  const result: Record<string, number> = {}
  for (let i = 0; i < daysBack; i++) {
    // Cede al hilo principal para no congelar la interfaz entre días.
    await new Promise((resolve) => setTimeout(resolve, 0))
    const day = new Date(start.getTime() + i * 86400000)
    const key = dateKey(day)
    const crossings = detectPlateCrossings(calculateMoonPath(day, 30))
    const dayQuakes = byDay[key] ?? []
    result[key] = crossings.filter((crossing) => nearestQuakeWithin(crossing.latitude, crossing.longitude, dayQuakes, 100) != null).length
  }
  return result
}
