export const dynamic = 'force-dynamic'

import { getSessionUser } from '@/lib/auth'
import { db, ensureSchema } from '@/lib/db'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)
    const payload = (await request.json()) as { name?: string }
    const name = (payload.name ?? '').trim().slice(0, 24)
    if (name.length < 3) return json({ error: 'Name too short' }, 400)
    await ensureSchema()
    const sql = db()
    const existing = await sql`SELECT id FROM users WHERE name = ${name} AND id <> ${user.id} LIMIT 1`
    if (existing.length > 0) return json({ error: 'Name taken' }, 409)
    await sql`UPDATE users SET name = ${name} WHERE id = ${user.id}`
    return json({ user: { id: user.id, name, createdAt: user.createdAt } })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Name error' }, 502)
  }
}
