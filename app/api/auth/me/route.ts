export const dynamic = 'force-dynamic'

import { getSessionUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    return new Response(JSON.stringify({ user }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}
