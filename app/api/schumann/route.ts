export const dynamic = 'force-dynamic'

import { getCached, setCached } from '@/lib/upstreamCache'

// Proxy de imágenes del Space Observing System (Tomsk, región 70).
// Servimos desde nuestro dominio para controlar la caché y evitar bloqueos
// por referer/hotlink del proveedor original.
//   ?chart=shm -> espectrograma (sonograma ELF)
//   ?chart=sra -> amplitud
//   ?chart=srf -> frecuencia
//   ?chart=srq -> factor Q
const CHARTS: Record<string, { url: string; type: string }> = {
  shm: { url: 'https://sos70.ru/provider.php?file=shm.jpg', type: 'image/jpeg' },
  sra: { url: 'https://sos70.ru/provider.php?file=sra.jpg', type: 'image/jpeg' },
  srf: { url: 'https://sos70.ru/provider.php?file=srf.jpg', type: 'image/jpeg' },
  srq: { url: 'https://sos70.ru/provider.php?file=srq.jpg', type: 'image/jpeg' },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chart = searchParams.get('chart') ?? 'shm'
  const target = CHARTS[chart] ?? CHARTS.shm
  const key = `schumann:${chart}`
  const cached = getCached<{ body: ArrayBuffer; fetchedAt: string }>(key, 300000)
  if (cached) {
    return new Response(cached.body, {
      status: 200,
      headers: {
        'Content-Type': target.type,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Fetched-At': cached.fetchedAt,
      },
    })
  }
  try {
    const res = await fetch(target.url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Tomsk ${res.status}`)
    const body = await res.arrayBuffer()
    const fetchedAt = new Date().toISOString()
    setCached(key, { body, fetchedAt })
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': target.type,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Fetched-At': fetchedAt,
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Upstream error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
