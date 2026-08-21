export const dynamic = 'force-dynamic'

import { latLngToCell } from 'h3-js'

const RESOLUTION = 3

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lon = parseFloat(searchParams.get('lon') ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return new Response(JSON.stringify({ error: 'Invalid coordinates' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const cell = latLngToCell(lat, lon, RESOLUTION)
  return new Response(JSON.stringify({ room: `h3:${cell}`, cell, resolution: RESOLUTION }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
