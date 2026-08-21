export const dynamic = 'force-dynamic'

import { getCached, setCached } from '@/lib/upstreamCache'

// Proxy a la API HAPI de INTERMAGNET (BGS) para evitar problemas de CORS en el navegador.
// Parámetros: ?id=<IAGA>/<type>/<cadence>/<components>&start=<ISO>&end=<ISO>
// Ajusta el rango pedido al rango válido del dataset (startDate/stopDate) para evitar errores 502.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!id || !start || !end) {
    return new Response('Missing id, start or end', { status: 400 })
  }

  const base = 'https://imag-data.bgs.ac.uk/GIN_V1/hapi'

  let reqStart = new Date(start)
  let reqEnd = new Date(end)
  const duration = reqEnd.getTime() - reqStart.getTime()
  // Consulta el rango válido del dataset (cacheado) para no pedir fechas fuera de cobertura.
  const infoKey = `intermagnet:info:${id}`
  let info = getCached<{ startDate?: string; stopDate?: string }>(infoKey, 3600000)
  if (!info) {
    try {
      const infoRes = await fetch(`${base}/info?id=${id}`)
      if (infoRes.ok) {
        info = await infoRes.json()
        setCached(infoKey, info)
      }
    } catch {
      // Si no podemos leer el rango, seguimos con el rango pedido.
    }
  }
  if (info) {
    const stop = info.stopDate ? new Date(info.stopDate) : null
    const from = info.startDate ? new Date(info.startDate) : null
    if (stop && reqEnd > stop) {
      reqEnd = stop
      reqStart.setTime(stop.getTime() - duration)
    }
    if (from && reqStart < from) reqStart = from
  }

  if (reqStart >= reqEnd) {
    return new Response('No data in range', { status: 404 })
  }

  const upstream = `${base}/data?id=${id}&time.min=${reqStart.toISOString()}&time.max=${reqEnd.toISOString()}`

  try {
    const res = await fetch(upstream, { headers: { Accept: 'text/csv, application/json' } })
    const text = await res.text()
    return new Response(text, {
      status: res.ok ? 200 : 502,
      headers: { 'Content-Type': res.ok ? 'text/csv' : 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch {
    return new Response('Upstream error', { status: 502 })
  }
}
