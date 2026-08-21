export const dynamic = 'force-dynamic'

import { getSessionUser } from '@/lib/auth'
import { db, ensureSchema } from '@/lib/db'

export type Favorite = { crossingId: string; time: string; plate: string; type: string; latitude: number; longitude: number }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return json({ favorites: [] })
    await ensureSchema()
    const rows = await db()`SELECT crossing_id, time, plate, type, latitude, longitude FROM user_favorites WHERE user_id = ${user.id} ORDER BY created_at DESC`
    const favorites = rows.map((r: Record<string, unknown>) => ({ crossingId: r.crossing_id, time: r.time, plate: r.plate, type: r.type, latitude: r.latitude, longitude: r.longitude }))
    return json({ favorites })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Favorites error' }, 502)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)
    const payload = (await request.json()) as Favorite
    const crossingId = (payload.crossingId ?? '').toString().slice(0, 120)
    if (!crossingId) return json({ error: 'Missing crossing' }, 400)
    await ensureSchema()
    await db()`INSERT INTO user_favorites (user_id, crossing_id, time, plate, type, latitude, longitude) VALUES (${user.id}, ${crossingId}, ${String(payload.time ?? '')}, ${String(payload.plate ?? '')}, ${String(payload.type ?? '')}, ${Number(payload.latitude) || 0}, ${Number(payload.longitude) || 0}) ON CONFLICT (user_id, crossing_id) DO NOTHING`
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Favorites error' }, 502)
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
    await db()`DELETE FROM user_favorites WHERE user_id = ${user.id} AND crossing_id = ${crossingId}`
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Favorites error' }, 502)
  }
}
