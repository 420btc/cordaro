export const dynamic = 'force-dynamic'

import { clearSessionCookie, cookieValue, destroySession, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const token = cookieValue(request.headers.get('cookie'), SESSION_COOKIE)
    await destroySession(token ?? '')
  } catch {}
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
  })
}
