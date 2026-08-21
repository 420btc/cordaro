import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { db, ensureSchema } from './db'
import type { AuthUser } from './types'

export const SESSION_COOKIE = 'cordaro_session'
const SESSION_MAX_AGE = 30 * 24 * 3600 // 30 días

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const candidate = scryptSync(password, salt, 64)
  const stored = Buffer.from(hash, 'hex')
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

export function sessionCookie(token: string, maxAge: number = SESSION_MAX_AGE): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i >= 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return null
}

export async function createSession(userId: number): Promise<string> {
  await ensureSchema()
  const token = randomBytes(32).toString('hex')
  const sql = db()
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, now() + interval '30 days')`
  return token
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return
  await ensureSchema()
  await db()`DELETE FROM sessions WHERE token = ${token}`
}

export async function getSessionUser(request: Request): Promise<AuthUser | null> {
  const token = cookieValue(request.headers.get('cookie'), SESSION_COOKIE)
  if (!token) return null
  await ensureSchema()
  const rows = await db()`SELECT u.id, u.name, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ${token} AND s.expires_at > now() LIMIT 1`
  const row = rows[0] as { id: number; name: string; created_at: string } | undefined
  if (!row) return null
  return { id: row.id, name: row.name, createdAt: row.created_at }
}
