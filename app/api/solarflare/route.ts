export const dynamic = 'force-dynamic'

import { getCached, setCached } from '@/lib/upstreamCache'

// Proxy del flujo de rayos X del satélite GOES (NOAA SWPC).
// Devuelve el último valor y una serie ligera (últimas ~6 h, banda 0.1–0.8 nm).

type RawFlare = { time_tag: string; flux: number; energy: string }

export async function GET() {
  const key = 'solarflare'
  const cached = getCached<string>(key, 60000)
  if (cached) {
    return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=60' } })
  }
  try {
    const res = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`NOAA ${res.status}`)
    const raw = (await res.json()) as RawFlare[]
    const points = raw
      .filter((r) => r.energy === '0.1-0.8nm')
      .map((r) => ({ time: r.time_tag, timestamp: new Date(r.time_tag).getTime(), flux: r.flux }))
      .filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.flux) && p.flux > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
    const step = Math.max(1, Math.floor(points.length / 360))
    const series = points.filter((_, i) => i % step === 0)
    const body = JSON.stringify({ latest: points[points.length - 1] ?? null, series })
    setCached(key, body)
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Upstream error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
