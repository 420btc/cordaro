export const dynamic = 'force-dynamic'

// Proxy de viento solar para evitar CORS y recortar el payload.
//   ?source=rtsw                 -> tiempo real NOAA SWPC (SOLAR-1/ACE/DSCOVR), últimas 48 h
//   ?source=soho&start=&end=     -> histórico SOHO/CELIAS Proton Monitor (5 min) vía CDAWeb HAPI
const FILL = -1.0e31

type RawRtsw = { time_tag: string; proton_density: number | null; proton_speed: number | null }
type RawKp = { time_tag: string; Kp: number | null }

function valid(v: number | null | undefined): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= FILL / 2) return null
  return v
}

async function fetchRtsw() {
  const res = await fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`NOAA ${res.status}`)
  const raw = (await res.json()) as RawRtsw[]
  const cutoff = Date.now() - 48 * 3600000
  const points = raw
    .map((r) => ({
      time: r.time_tag,
      timestamp: new Date(r.time_tag).getTime(),
      density: valid(r.proton_density),
      speed: valid(r.proton_speed),
    }))
    .filter((p) => Number.isFinite(p.timestamp) && p.timestamp >= cutoff && (p.density != null || p.speed != null))
    .sort((a, b) => a.timestamp - b.timestamp)
  return { source: 'rtsw', points }
}

async function fetchKp() {
  const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`NOAA ${res.status}`)
  const raw = (await res.json()) as RawKp[]
  const valid = raw
    .map((r) => ({ time: r.time_tag, kp: typeof r.Kp === 'number' && Number.isFinite(r.Kp) ? r.Kp : null }))
    .filter((p): p is { time: string; kp: number } => p.kp != null)
  const last = valid[valid.length - 1]
  return { kp: last?.kp ?? null, time: last?.time ?? '' }
}

async function fetchSoho(start: string, end: string) {
  const url = `https://cdaweb.gsfc.nasa.gov/hapi/data?id=SOHO_CELIAS-PM_5MIN&parameters=V_p,N_p&time.min=${encodeURIComponent(start)}&time.max=${encodeURIComponent(end)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`CDAWeb ${res.status}`)
  const text = await res.text()
  const points: { time: string; timestamp: number; density: number | null; speed: number | null }[] = []
  for (const line of text.split('\n')) {
    const row = line.trim()
    if (!/^\d{4}-/.test(row)) continue
    const cols = row.split(',')
    if (cols.length < 3) continue
    const timestamp = new Date(cols[0]).getTime()
    if (!Number.isFinite(timestamp)) continue
    const speed = valid(parseFloat(cols[1]))
    const density = valid(parseFloat(cols[2]))
    if (density == null && speed == null) continue
    points.push({ time: cols[0], timestamp, density, speed })
  }
  points.sort((a, b) => a.timestamp - b.timestamp)
  return { source: 'soho', points }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source') ?? 'rtsw'
  try {
    if (source === 'kp') {
      const data = await fetchKp()
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' } })
    }
    if (source === 'soho') {
      const start = searchParams.get('start')
      const end = searchParams.get('end')
      if (!start || !end) return new Response('Missing start or end', { status: 400 })
      const data = await fetchSoho(start, end)
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } })
    }
    const data = await fetchRtsw()
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Upstream error' }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
}
