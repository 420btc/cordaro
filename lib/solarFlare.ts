export type FlarePoint = { time: string; timestamp: number; flux: number }
export type SolarFlareData = { latest: FlarePoint | null; series: FlarePoint[] }

// Convierte el flujo de rayos X (W/m², banda 0.1–0.8 nm) a la clase GOES (A/B/C/M/X).
export function flareClassOf(flux: number): string {
  if (flux >= 1e-4) return `X${(flux / 1e-4).toFixed(1)}`
  if (flux >= 1e-5) return `M${(flux / 1e-5).toFixed(1)}`
  if (flux >= 1e-6) return `C${(flux / 1e-6).toFixed(1)}`
  if (flux >= 1e-7) return `B${(flux / 1e-7).toFixed(1)}`
  return `A${(flux / 1e-8).toFixed(1)}`
}

export async function fetchSolarFlare(): Promise<SolarFlareData> {
  const res = await fetch('/api/solarflare')
  if (!res.ok) throw new Error(`Solar flare ${res.status}`)
  return res.json() as Promise<SolarFlareData>
}
