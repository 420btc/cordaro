export const dynamic = 'force-dynamic'

import { createSession, hashPassword, sessionCookie } from '@/lib/auth'
import { db, ensureSchema } from '@/lib/db'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { name?: string; password?: string }
    const name = (payload.name ?? '').trim().slice(0, 24)
    const password = payload.password ?? ''
    if (name.length < 3) return json({ error: 'Name too short' }, 400)
    if (password.length < 6) return json({ error: 'Password too short' }, 400)

    await ensureSchema()
    const sql = db()
    const existing = await sql`SELECT id FROM users WHERE name = ${name} LIMIT 1`
    if (existing.length > 0) return json({ error: 'Name taken' }, 409)

    const { salt, hash } = hashPassword(password)
    const rows = await sql`INSERT INTO users (name, password_hash, password_salt) VALUES (${name}, ${hash}, ${salt}) RETURNING id, name, created_at`
    const row = rows[0] as { id: number; name: string; created_at: string }
    const token = await createSession(row.id)
    return new Response(JSON.stringify({ user: { id: row.id, name: row.name, createdAt: row.created_at } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Register error' }, 502)
  }
}
