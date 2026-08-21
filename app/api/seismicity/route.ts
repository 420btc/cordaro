export const dynamic = 'force-dynamic'

import { regionById, type RegionId, type RegionalQuake } from '@/lib/regionalSeismicity'

// Proxy unificado de sismicidad regional:
//   ?region=espana    -> IGN (Red Sísmica Nacional) · últimos 10 días (HTML parseado)
//   ?region=eeuu      -> USGS · EE.UU. continental · últimos 30 días
//   ?region=mexico    -> USGS · México · últimos 30 días
//   ?region=chile     -> USGS · Chile · últimos 30 días
//   ?region=indonesia -> BMKG · últimos sismos M5+

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

function toIsoDate(ddMmYyyy: string): string {
  const [d, m, y] = ddMmYyyy.split('/').map(Number)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

async function fetchIgn(): Promise<RegionalQuake[]> {
  const res = await fetch('https://www.ign.es/web/ign/portal/ultimos-terremotos/-/ultimos-terremotos/get10dias', {
    cache: 'no-store',
    headers: { 'User-Agent': 'magnetic-anomaly-dashboard/1.0 (+contact)' },
  })
  if (!res.ok) throw new Error(`IGN ${res.status}`)
  const html = await res.text()
  const quakes: RegionalQuake[] = []
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
      date: toIsoDate(dateStr),
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

const USGS_MIN_MAG: Record<string, number> = { eeuu: 2.5, mexico: 3.0, chile: 3.0 }

async function fetchUsgs(region: RegionId): Promise<RegionalQuake[]> {
  const def = regionById(region)
  const minmag = USGS_MIN_MAG[region] ?? 3.0
  const end = new Date()
  const start = new Date(end.getTime() - 30 * 86400000)
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: start.toISOString(),
    endtime: end.toISOString(),
    minmagnitude: String(minmag),
    minlatitude: String(def.latMin),
    maxlatitude: String(def.latMax),
    minlongitude: String(def.lonMin),
    maxlongitude: String(def.lonMax),
    orderby: 'time',
  })
  const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`USGS ${res.status}`)
  const payload = (await res.json()) as { features?: Array<{ id: string; properties: { mag: number; place: string; time: number }; geometry: { coordinates: [number, number, number] } }> }
  return (payload.features ?? []).map((f) => {
    const [lon, lat, depth] = f.geometry.coordinates
    const date = new Date(f.properties.time)
    return {
      id: f.id,
      timestamp: f.properties.time,
      date: date.toISOString().slice(0, 10),
      time: date.toISOString().slice(11, 19),
      latitude: lat,
      longitude: lon,
      depth,
      magnitude: f.properties.mag,
      magType: '',
      intensity: '',
      place: f.properties.place,
    }
  })
}

async function fetchBmkg(): Promise<RegionalQuake[]> {
  const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`BMKG ${res.status}`)
  const payload = (await res.json()) as { Infogempa?: { gempa?: Array<{ DateTime: string; Coordinates: string; Magnitude: string; Kedalaman: string; Wilayah: string }> } }
  return (payload.Infogempa?.gempa ?? []).map((g) => {
    const [lat, lon] = g.Coordinates.split(',').map(Number)
    const date = new Date(g.DateTime)
    return {
      id: `${g.DateTime}-${g.Magnitude}-${g.Coordinates}`,
      timestamp: date.getTime(),
      date: date.toISOString().slice(0, 10),
      time: date.toISOString().slice(11, 19),
      latitude: lat,
      longitude: lon,
      depth: parseFloat(g.Kedalaman),
      magnitude: parseFloat(g.Magnitude),
      magType: '',
      intensity: '',
      place: g.Wilayah,
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = (searchParams.get('region') ?? 'espana') as RegionId
  try {
    let quakes: RegionalQuake[]
    let source: string
    if (region === 'indonesia') {
      quakes = await fetchBmkg()
      source = 'BMKG'
    } else if (region === 'eeuu' || region === 'mexico' || region === 'chile') {
      quakes = await fetchUsgs(region)
      source = 'USGS'
    } else {
      quakes = await fetchIgn()
      source = 'IGN'
    }
    return new Response(JSON.stringify({ source, region, quakes }), {
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
