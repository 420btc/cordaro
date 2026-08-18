export type SolarWindPoint = { time: string; timestamp: number; density: number | null; speed: number | null }
export type SolarWindData = { source: 'rtsw' | 'soho'; points: SolarWindPoint[] }

// Umbral óptimo de densidad de protones del paper (Marchitelli et al. 2020).
export const PROTON_THRESHOLD = 15.5

export function fluxOf(p: SolarWindPoint): number | null {
  if (p.density == null || p.speed == null) return null
  return p.density * p.speed
}

export function dynamicPressureOf(p: SolarWindPoint): number | null {
  if (p.density == null || p.speed == null) return null
  return (p.density * p.speed * p.speed) / 2
}

export async function fetchSolarWind(source: 'rtsw' | 'soho', start?: string, end?: string): Promise<SolarWindData> {
  const params = new URLSearchParams({ source })
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const res = await fetch(`/api/solarwind?${params.toString()}`)
  if (!res.ok) throw new Error(`Solar wind ${res.status}`)
  return res.json() as Promise<SolarWindData>
}

export type GeomagneticData = { kp: number | null; time: string }

// Escala NOAA G (tormentas geomagnéticas) a partir del Kp planetario estimado.
// G0 = calma, G1 = menor, ... G5 = extrema.
export function gScaleOf(kp: number): number {
  if (kp >= 9) return 5
  if (kp >= 8) return 4
  if (kp >= 7) return 3
  if (kp >= 6) return 2
  if (kp >= 5) return 1
  return 0
}

export async function fetchGeomagnetic(): Promise<GeomagneticData> {
  const res = await fetch('/api/solarwind?source=kp')
  if (!res.ok) throw new Error(`Geomagnetic ${res.status}`)
  return res.json() as Promise<GeomagneticData>
}

export type PeakStatus = { currentlyAbove: boolean; lastDrop: number | null; lastPeak: number | null }

// Detecta los picos de densidad: cuándo cruza por encima del umbral y cuándo
// vuelve a caer por debajo. El paper usa la ventana de 24 h posterior a la caída.
export function analyzePeaks(points: SolarWindPoint[], threshold = PROTON_THRESHOLD): PeakStatus {
  const sorted = points.filter((p) => p.density != null).sort((a, b) => a.timestamp - b.timestamp)
  let above = false
  let lastPeak: number | null = null
  let lastDrop: number | null = null
  for (const p of sorted) {
    if ((p.density as number) >= threshold) {
      above = true
      lastPeak = p.timestamp
    } else if (above) {
      above = false
      lastDrop = p.timestamp
    }
  }
  return { currentlyAbove: above, lastPeak, lastDrop }
}
