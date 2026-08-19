export const dynamic = 'force-dynamic'

// Proxy de imágenes del Space Observing System (Tomsk State University).
// El feed es HTTP y sin CORS; al servirlas desde aquí evitamos el mixed-content
// y el bloqueo por CORS en el navegador.
//   ?chart=shm -> espectrograma (Schumann H-field)
//   ?chart=sra -> amplitud
//   ?chart=srf -> frecuencia
//   ?chart=srq -> factor Q
const CHARTS: Record<string, { url: string; type: string }> = {
  shm: { url: 'http://sosrff.tsu.ru/new/shm.jpg', type: 'image/jpeg' },
  sra: { url: 'http://sosrff.tsu.ru/new/sra.jpg', type: 'image/jpeg' },
  srf: { url: 'http://sosrff.tsu.ru/new/srf.jpg', type: 'image/jpeg' },
  srq: { url: 'http://sosrff.tsu.ru/new/srq.jpg', type: 'image/jpeg' },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chart = searchParams.get('chart') ?? 'shm'
  const target = CHARTS[chart] ?? CHARTS.shm
  try {
    const res = await fetch(target.url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Tomsk ${res.status}`)
    const body = await res.arrayBuffer()
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': target.type,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Upstream error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
