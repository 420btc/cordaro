import { lineString, point, lineIntersect } from '@turf/turf'
import type { PlateCrossing, MoonPosition, PlateSegment } from './types'
import { PLATE_BOUNDARIES } from './plateBoundaries'
import { calculateMoonPath } from './astronomy'

export function detectPlateCrossings(path: MoonPosition[], segments: PlateSegment[] = PLATE_BOUNDARIES): PlateCrossing[] {
  const crossings: PlateCrossing[] = []
  // Precalcula una vez los límites como geometría de Turf (evita recrearlos en cada paso).
  const boundaries = segments.map((segment) => lineString(segment.coordinates))
  path.slice(1).forEach((position, index) => {
    const previous = path[index]
    // Evita falsos cruces cuando la trayectoria salta la línea de cambio de fecha (>180°).
    const moonJump = Math.abs(position.longitude - previous.longitude) > 180
    const antiJump = Math.abs(position.antipodeLongitude - previous.antipodeLongitude) > 180
    const moonLine = lineString([[previous.longitude, previous.latitude], [position.longitude, position.latitude]])
    const antipodeLine = lineString([[previous.antipodeLongitude, previous.antipodeLatitude], [position.antipodeLongitude, position.antipodeLatitude]])
    boundaries.forEach((boundary, segmentIndex) => {
      const segment = segments[segmentIndex]
      if (!moonJump && lineIntersect(moonLine, boundary).features.length > 0) crossings.push({ id: `moon-${index}-${segmentIndex}`, time: position.time, timestamp: position.timestamp, plateA: segment.name, plateB: 'Luna', type: 'moon', latitude: position.latitude, longitude: position.longitude, angle: position.sunAngle, color: '#c0564a' })
      if (!antiJump && lineIntersect(antipodeLine, boundary).features.length > 0) crossings.push({ id: `anti-${index}-${segmentIndex}`, time: position.time, timestamp: position.timestamp, plateA: segment.name, plateB: 'Antípoda', type: 'antipode', latitude: position.antipodeLatitude, longitude: position.antipodeLongitude, angle: position.sunAngle, color: '#5b8db8' })
    })
  })
  return crossings
}

export function isNearCrossing(timestamp: number, crossings: PlateCrossing[]) { return crossings.some((crossing) => Math.abs(timestamp - crossing.timestamp) <= 3600000) }
export function isOnPlateBoundary(latitude: number, longitude: number) { return point([longitude, latitude]) }

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

// Calcula todos los cruces Luna/antípoda de un mes completo, cediendo al hilo
// principal entre días para no bloquear la interfaz durante el cálculo.
export async function detectMonthCrossings(year: number, monthIndex: number, stepMinutes = 30): Promise<PlateCrossing[]> {
  const days = daysInMonth(year, monthIndex)
  const crossings: PlateCrossing[] = []
  for (let day = 1; day <= days; day++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const date = new Date(Date.UTC(year, monthIndex, day))
    const dayCrossings = detectPlateCrossings(calculateMoonPath(date, stepMinutes))
    for (const crossing of dayCrossings) crossings.push({ ...crossing, id: `${year}-${monthIndex}-${day}-${crossing.id}` })
  }
  return crossings
}
