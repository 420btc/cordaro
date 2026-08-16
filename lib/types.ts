export type MoonPosition = { time: string; timestamp: number; latitude: number; longitude: number; antipodeLatitude: number; antipodeLongitude: number; sunAngle: number; phase: number; distanceKm: number }
export type SunPosition = { time: string; timestamp: number; latitude: number; longitude: number; distanceKm: number }
export type PlateCrossing = { id: string; time: string; timestamp: number; plateA: string; plateB: string; type: 'moon' | 'antipode'; latitude: number; longitude: number; angle: number; color: string }
export type MagneticAnomaly = { time: string; timestamp: number; energy: number; globalRate: number }
export type Earthquake = { id: string; time: string; timestamp: number; latitude: number; longitude: number; depth: number; magnitude: number; place: string }
export type Station = { code: string; name: string; latitude: number; longitude: number }
export type MapPoint = { latitude: number; longitude: number; time: string; type: 'moon' | 'antipode' }
export type PlateSegment = { name: string; coordinates: [number, number][] }
export type DayData = { positions: MoonPosition[]; sunPositions: SunPosition[]; crossings: PlateCrossing[]; anomalies: MagneticAnomaly[]; earthquakes: Earthquake[] }
export type LoadingState = 'idle' | 'loading' | 'ready' | 'error'
export const STATIONS: Station[] = [
  { code: 'TUC', name: 'Tucson', latitude: 32.2, longitude: -110.9 }, { code: 'BSL', name: 'Basel', latitude: 47.6, longitude: 7.6 },
  { code: 'HON', name: 'Honolulu', latitude: 21.3, longitude: -157.9 }, { code: 'PPT', name: 'Pamatai', latitude: -17.6, longitude: -149.6 },
  { code: 'HYB', name: 'Hyderabad', latitude: 17.4, longitude: 78.5 }, { code: 'PHU', name: 'Phu Thuy', latitude: 21.0, longitude: 105.9 },
  { code: 'GAN', name: 'Gan', latitude: 0.7, longitude: 73.2 }, { code: 'KNY', name: 'Kanoya', latitude: 31.4, longitude: 130.7 },
  { code: 'GUA', name: 'Guam', latitude: 13.6, longitude: 144.9 }, { code: 'CTA', name: 'Canberra', latitude: -35.3, longitude: 149.0 },
]
export const PLATE_LABELS = [
  ['Pacific Plate', -150, 8], ['North American Plate', -108, 42], ['South American Plate', -62, -15], ['Nazca Plate', -95, -18],
  ['African Plate', 20, 0], ['Eurasian Plate', 75, 45], ['Indian Plate', 78, 10], ['Australian Plate', 125, -25], ['Antarctic Plate', 20, -62],
] as const
export const formatUtc = (date: Date) => date.toISOString().slice(11, 16)
export const dateKey = (date: Date) => date.toISOString().slice(0, 10)
export const utcDate = (key: string) => new Date(`${key}T00:00:00Z`)
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const seeded = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }

export const generateAnomalies = (date: Date, crossings: PlateCrossing[], earthquakes: Earthquake[]): MagneticAnomaly[] => Array.from({ length: 97 }, (_, i) => {
  const timestamp = date.getTime() + i * 15 * 60000; const t = i / 4
  const bump = crossings.reduce((sum, c) => { const diff = Math.abs(timestamp - c.timestamp) / 3600000; return sum + (diff < 1.4 ? Math.max(0, 4.8 * (1 - diff / 1.4)) : 0) }, 0)
  const base = 0.4 + 0.35 * Math.sin(t * 1.7) + seeded(i + date.getUTCDate()) * 0.5
  const quakeCount = earthquakes.filter((q) => Math.abs(timestamp - q.timestamp) <= 3600000).length
  return { time: formatUtc(new Date(timestamp)), timestamp, energy: clamp(base + bump * 1.4, 0, 10), globalRate: clamp(quakeCount, 0, 10) }
})
