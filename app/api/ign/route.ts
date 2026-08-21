export const dynamic = 'force-dynamic'

// Proxy + parser de "últimos terremotos" del IGN (Red Sísmica Nacional).
// La página oficial es HTML; aquí la convertimos en JSON para el cliente.
// Fuente: últimos 10 días, magnitud ≥ 1.5 o sentidos.

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú', '&ntilde;': 'ñ',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú', '&Ntilde;': 'Ñ',
  '&ordm;': 'º', '&ordf;': 'ª',
}

function clean(cell: string): string {
  return cell
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z#0-9]+;/g, (match) => ENTITIES[match] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseIgnHtml(html: string) {
  const quakes: Array<Record<string, unknown>> = []
  for (const row of html.split('<tr>').slice(1)) {
    const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g), (m) => m[1])
    if (cells.length < 11) continue
    const id = clean(cells[0])
    if (!/^es\d{4}[a-z]+$/i.test(id)) continue
    const dateStr = clean(cells[1])
    const timeUtc = clean(cells[2])
    const parts = dateStr.split('/').map(Number)
    const timeParts = timeUtc.split(':').map(Number)
    const timestamp = Date.UTC(parts[2], parts[1] - 1, parts[0], timeParts[0] ?? 0, timeParts[1] ?? 0, timeParts[2] ?? 0)
    quakes.push({
      id,
      date: dateStr,
      time: timeUtc,
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      latitude: parseFloat(clean(cells[4])),
      longitude: parseFloat(clean(cells[5])),
      depth: parseFloat(clean(cells[6])),
      magnitude: parseFloat(clean(cells[7])),
      magType: clean(cells[8]),
      intensity: clean(cells[9]),
      place: clean(cells[10]),
    })
  }
  return quakes
}

export async function GET() {
  try {
    const res = await fetch('https://www.ign.es/web/ign/portal/ultimos-terremotos/-/ultimos-terremotos/get10dias', {
      cache: 'no-store',
      headers: { 'User-Agent': 'magnetic-anomaly-dashboard/1.0 (+contact)' },
    })
    if (!res.ok) throw new Error(`IGN ${res.status}`)
    const html = await res.text()
    const quakes = parseIgnHtml(html)
    return new Response(JSON.stringify({ source: 'IGN', quakes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Upstream error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
