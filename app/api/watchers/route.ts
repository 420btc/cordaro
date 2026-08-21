export const dynamic = 'force-dynamic'

import { getSessionUser } from '@/lib/auth'
import { db, ensureSchema } from '@/lib/db'

export type Watcher = { crossingId: string; name: string; time: string; plate: string; type: string; latitude: number; longitude: number }
export type WatcherSummary = { crossingId: string; count: number; names: string[] }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

// Devuelve todos los observadores agrupados por cruce, de forma pública.
export async function GET() {
  try {
    await ensureSchema()
    const rows = await db()`SELECT cw.crossing_id, cw.time, cw.plate, cw.type, cw.latitude, cw.longitude, u.name FROM crossing_watchers cw JOIN users u ON u.id = cw.user_id ORDER BY cw.created_at ASC`
    const byCrossing = new Map<string, { time: string; plate: string; type: string; latitude: number; longitude: number; names: string[] }>()
    for (const r of rows as Array<Record<string, unknown>>) {
      const id = String(r.crossing_id)
      const entry = byCrossing.get(id) ?? { time: String(r.time ?? ''), plate: String(r.plate ?? ''), type: String(r.type ?? ''), latitude: Number(r.latitude) || 0, longitude: Number(r.longitude) || 0, names: [] }
      entry.names.push(String(r.name ?? ''))
      byCrossing.set(id, entry)
    }
    const watchers = [...byCrossing.entries()].map(([crossingId, e]) => ({ crossingId, time: e.time, plate: e.plate, type: e.type, latitude: e.latitude, longitude: e.longitude, names: e.names }))
    return json({ watchers })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Watchers error' }, 502)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)
    const payload = (await request.json()) as { crossingId?: string; time?: string; plate?: string; type?: string; latitude?: number; longitude?: number }
    const crossingId = (payload.crossingId ?? '').toString().slice(0, 120)
    if (!crossingId) return json({ error: 'Missing crossing' }, 400)
    await ensureSchema()
    await db()`INSERT INTO crossing_watchers (user_id, crossing_id, time, plate, type, latitude, longitude) VALUES (${user.id}, ${crossingId}, ${String(payload.time ?? '')}, ${String(payload.plate ?? '')}, ${String(payload.type ?? '')}, ${Number(payload.latitude) || 0}, ${Number(payload.longitude) || 0}) ON CONFLICT (user_id, crossing_id) DO NOTHING`
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Watchers error' }, 502)
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)
    const { searchParams } = new URL(request.url)
    const crossingId = (searchParams.get('crossingId') ?? '').slice(0, 120)
    if (!crossingId) return json({ error: 'Missing crossing' }, 400)
    await ensureSchema()
    await db()`DELETE FROM crossing_watchers WHERE user_id = ${user.id} AND crossing_id = ${crossingId}`
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Watchers error' }, 502)
  }
}
