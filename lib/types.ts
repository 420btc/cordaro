export type MoonPosition = { time: string; timestamp: number; latitude: number; longitude: number; antipodeLatitude: number; antipodeLongitude: number; sunAngle: number; phase: number; distanceKm: number }
export type SunPosition = { time: string; timestamp: number; latitude: number; longitude: number; distanceKm: number }
export type PlateCrossing = { id: string; time: string; timestamp: number; plateA: string; plateB: string; type: 'moon' | 'antipode'; latitude: number; longitude: number; angle: number; color: string }
export type MagneticAnomaly = { time: string; timestamp: number; red: number; orange: number; green: number; purple: number; blue: number; globalRate: number }
export type Earthquake = { id: string; time: string; timestamp: number; latitude: number; longitude: number; depth: number; magnitude: number; place: string }
export type Station = { code: string; name: string; latitude: number; longitude: number }
export type MapPoint = { latitude: number; longitude: number; time: string; type: 'moon' | 'antipode' }
export type PlateSegment = { name: string; coordinates: [number, number][] }
export type DayData = { positions: MoonPosition[]; sunPositions: SunPosition[]; crossings: PlateCrossing[]; anomalies: MagneticAnomaly[]; earthquakes: Earthquake[] }
export type LoadingState = 'idle' | 'loading' | 'ready' | 'error'
export const PLATE_COLORS = ['#e3342f', '#f59e0b', '#16a34a', '#7c3aed', '#2563eb']
export const STATIONS: Station[] = [
  { code: 'TUC', name: 'Tucson', latitude: 32.2, longitude: -110.9 }, { code: 'BSL', name: 'Basel', latitude: 47.6, longitude: 7.6 },
  { code: 'HON', name: 'Honolulu', latitude: 21.3, longitude: -157.9 }, { code: 'PPT', name: 'Pamatai', latitude: -17.6, longitude: -149.6 },
  { code: 'HYB', name: 'Hyderabad', latitude: 17.4, longitude: 78.5 }, { code: 'PHU', name: 'Phu Thuy', latitude: 21.0, longitude: 105.9 },
  { code: 'GAN', name: 'Gan', latitude: 0.7, longitude: 73.2 }, { code: 'KNY', name: 'Kanoya', latitude: 31.4, longitude: 130.7 },
  { code: 'GUA', name: 'Guam', latitude: 13.6, longitude: 144.9 }, { code: 'CTA', name: 'Canberra', latitude: -35.3, longitude: 149.0 },
]
export const PLATE_SEGMENTS: PlateSegment[] = [
  { name: 'Pacific Plate', coordinates: [[-175, 52], [-150, 35], [-125, 20], [-110, -5], [-100, -35], [-75, -55]] },
  { name: 'Mid-Atlantic Ridge', coordinates: [[-28, 65], [-25, 40], [-20, 15], [-17, -10], [-12, -35], [-5, -58]] },
  { name: 'East African Rift', coordinates: [[30, 15], [34, 2], [36, -15], [45, -28], [50, -42]] },
  { name: 'Indian–Australian Boundary', coordinates: [[70, -5], [92, -10], [110, -20], [135, -35], [155, -42]] },
  { name: 'Ring of Fire', coordinates: [[145, 55], [155, 35], [170, 10], [165, -15], [145, -35]] },
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

export const generateDemoEarthquakes = (date: Date): Earthquake[] => [
  { id: 'usgs-1', time: formatUtc(new Date(date.getTime() + 3.42 * 3600000)), timestamp: date.getTime() + 3.42 * 3600000, latitude: -5.8, longitude: 146.2, depth: 42, magnitude: 5.4, place: '55 km S of Finschhafen, Papua New Guinea' },
  { id: 'usgs-2', time: formatUtc(new Date(date.getTime() + 7.16 * 3600000)), timestamp: date.getTime() + 7.16 * 3600000, latitude: 36.1, longitude: 70.7, depth: 110, magnitude: 6.9, place: 'Hindu Kush region, Afghanistan' },
  { id: 'usgs-3', time: formatUtc(new Date(date.getTime() + 10.55 * 3600000)), timestamp: date.getTime() + 10.55 * 3600000, latitude: -23.4, longitude: -68.2, depth: 125, magnitude: 5.1, place: 'Antofagasta, Chile' },
  { id: 'usgs-4', time: formatUtc(new Date(date.getTime() + 15.3 * 3600000)), timestamp: date.getTime() + 15.3 * 3600000, latitude: 2.2, longitude: 126.8, depth: 34, magnitude: 5.8, place: 'Molucca Sea, Indonesia' },
  { id: 'usgs-5', time: formatUtc(new Date(date.getTime() + 20.18 * 3600000)), timestamp: date.getTime() + 20.18 * 3600000, latitude: 38.4, longitude: 142.1, depth: 52, magnitude: 7.7, place: 'Off the coast of Honshu, Japan' },
]

export const generateAnomalies = (date: Date, crossings: PlateCrossing[], earthquakes: Earthquake[]): MagneticAnomaly[] => Array.from({ length: 97 }, (_, i) => {
  const timestamp = date.getTime() + i * 15 * 60000; const t = i / 4
  const bump = crossings.reduce((sum, c) => { const diff = Math.abs(timestamp - c.timestamp) / 3600000; return sum + (diff < 1.4 ? Math.max(0, 4.8 * (1 - diff / 1.4)) : 0) }, 0)
  const quake = earthquakes.reduce((sum, q) => { const diff = Math.abs(timestamp - q.timestamp) / 3600000; return sum + (diff < 0.8 ? q.magnitude * 0.4 * (1 - diff / 0.8) : 0) }, 0)
  const base = 0.3 + 0.35 * Math.sin(t * 1.7) + seeded(i + date.getUTCDate()) * 0.45
  return { time: formatUtc(new Date(timestamp)), timestamp, red: clamp(base + bump * 0.9, 0, 10), orange: clamp(base * .65 + bump * .7, 0, 10), green: clamp(base * .35 + bump * .48, 0, 10), purple: clamp(base * .25 + bump * .62, 0, 10), blue: clamp(base * .18 + bump * .3, 0, 10), globalRate: clamp(1.15 + 0.5 * Math.sin(t / 3) + quake * .15 + bump * .08, 0, 10) }
})
