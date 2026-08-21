import { calculateMoonPath } from '@/lib/astronomy'
import { detectPlateCrossings } from '@/lib/plates'
import { fetchEarthquakesRange } from '@/lib/earthquakes'
import { permutationTest, type CrossingLike } from '@/lib/statistics'
import { getCached, setCached } from '@/lib/upstreamCache'

export const dynamic = 'force-dynamic'

const MAG_THRESHOLDS = [4, 5, 6]
const RADIUS_KM = 100

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const daysBack = clamp(parseInt(searchParams.get('days') ?? '30', 10), 7, 180)
  const windowHours = clamp(parseInt(searchParams.get('window') ?? '24', 10), 1, 72)
  const iterations = clamp(parseInt(searchParams.get('iterations') ?? '200', 10), 50, 2000)

  const cacheKey = `validate:${daysBack}:${windowHours}:${iterations}`
  const cached = getCached<string>(cacheKey, 600000)
  if (cached) {
    return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600, s-maxage=600' } })
  }

  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
  const start = new Date(end.getTime() - (daysBack - 1) * 86400000)
  start.setUTCHours(0, 0, 0, 0)

  try {
    const quakes = await fetchEarthquakesRange(start, end)

    const crossings: CrossingLike[] = []
    for (let i = 0; i < daysBack; i++) {
      const day = new Date(start.getTime() + i * 86400000)
      const path = calculateMoonPath(day, 30)
      for (const c of detectPlateCrossings(path)) {
        crossings.push({ timestamp: c.timestamp, latitude: c.latitude, longitude: c.longitude })
      }
    }

    const windowMs = windowHours * 3600000
    const spanStart = start.getTime()
    const spanEnd = end.getTime() + 1

    const results = MAG_THRESHOLDS.map((mag) => {
      const subset = quakes.filter((q) => q.magnitude >= mag)
      if (subset.length < 5) {
        return { magnitude: mag, quakes: subset.length, validated: null, expected: null, relativeRate: null, p: null, insufficient: true }
      }
      const perm = permutationTest(crossings, subset, windowMs, RADIUS_KM, spanStart, spanEnd, iterations)
      const relativeRate = perm.expected > 0 ? perm.observed / perm.expected : (perm.observed > 0 ? Infinity : 1)
      return {
        magnitude: mag,
        quakes: subset.length,
        validated: perm.observed,
        expected: Number(perm.expected.toFixed(2)),
        relativeRate: Number.isFinite(relativeRate) ? Number(relativeRate.toFixed(2)) : null,
        p: Number(perm.p.toFixed(4)),
        insufficient: false,
      }
    })

    const body = JSON.stringify({
      period: { start: start.toISOString(), end: end.toISOString(), days: daysBack },
      windowHours,
      radiusKm: RADIUS_KM,
      iterations,
      totalCrossings: crossings.length,
      results,
    })
    setCached(cacheKey, body)
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600, s-maxage=600' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Backtest error' }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
}
