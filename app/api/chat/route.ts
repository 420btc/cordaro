export const dynamic = 'force-dynamic'

import { db, ensureSchema } from '@/lib/db'

type ChatRow = { id: number; room: string; name: string; body: string; created_at: string }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const room = (searchParams.get('room') ?? 'global').trim().slice(0, 64) || 'global'
  try {
    await ensureSchema()
    const sql = db()
    const rows = (await sql`SELECT id, room, name, body, created_at FROM chat_messages WHERE room = ${room} ORDER BY id DESC LIMIT 100`) as ChatRow[]
    const messages = rows.reverse().map((r) => ({ id: r.id, name: r.name, body: r.body, createdAt: r.created_at }))
    return json({ room, messages })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Chat error' }, 502)
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { room?: string; name?: string; body?: string }
    const room = (payload.room ?? 'global').trim().slice(0, 64) || 'global'
    const name = (payload.name ?? '').trim().slice(0, 24)
    const body = (payload.body ?? '').trim().slice(0, 500)
    if (!name || !body) return json({ error: 'Missing name or body' }, 400)
    await ensureSchema()
    const sql = db()
    await sql`INSERT INTO chat_messages (room, name, body) VALUES (${room}, ${name}, ${body})`
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Chat error' }, 502)
  }
}
