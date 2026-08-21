export const dynamic = 'force-dynamic'

import { createSession, sessionCookie, verifyPassword } from '@/lib/auth'
import { db, ensureSchema } from '@/lib/db'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { name?: string; password?: string }
    const name = (payload.name ?? '').trim()
    const password = payload.password ?? ''
    if (!name || !password) return json({ error: 'Missing credentials' }, 400)

    await ensureSchema()
    const sql = db()
    const rows = await sql`SELECT id, name, password_hash, password_salt, created_at FROM users WHERE name = ${name} LIMIT 1`
    const row = rows[0] as { id: number; name: string; password_hash: string | null; password_salt: string | null; created_at: string } | undefined
    if (!row || !row.password_hash || !row.password_salt || !verifyPassword(password, row.password_salt, row.password_hash)) {
      return json({ error: 'Invalid credentials' }, 401)
    }
    const token = await createSession(row.id)
    return new Response(JSON.stringify({ user: { id: row.id, name: row.name, createdAt: row.created_at } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Login error' }, 502)
  }
}
