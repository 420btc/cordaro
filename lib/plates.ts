import { lineString, point, lineIntersect } from '@turf/turf'
import type { PlateCrossing, MoonPosition, PlateSegment } from './types'
import { PLATE_COLORS, PLATE_SEGMENTS } from './types'

export function detectPlateCrossings(path: MoonPosition[], segments: PlateSegment[] = PLATE_SEGMENTS): PlateCrossing[] {
  const crossings: PlateCrossing[] = []
  path.slice(1).forEach((position, index) => {
    const previous = path[index]
    // Evita falsos cruces cuando la trayectoria salta la línea de cambio de fecha (>180°).
    const moonJump = Math.abs(position.longitude - previous.longitude) > 180
    const antiJump = Math.abs(position.antipodeLongitude - previous.antipodeLongitude) > 180
    const moonLine = lineString([[previous.longitude, previous.latitude], [position.longitude, position.latitude]])
    const antipodeLine = lineString([[previous.antipodeLongitude, previous.antipodeLatitude], [position.antipodeLongitude, position.antipodeLatitude]])
    segments.forEach((segment, segmentIndex) => {
      const boundary = lineString(segment.coordinates)
      if (!moonJump && lineIntersect(moonLine, boundary).features.length > 0) crossings.push({ id: `moon-${index}-${segmentIndex}`, time: position.time, timestamp: position.timestamp, plateA: segment.name, plateB: 'Luna', type: 'moon', latitude: position.latitude, longitude: position.longitude, angle: position.sunAngle, color: PLATE_COLORS[segmentIndex % PLATE_COLORS.length] })
      if (!antiJump && lineIntersect(antipodeLine, boundary).features.length > 0) crossings.push({ id: `anti-${index}-${segmentIndex}`, time: position.time, timestamp: position.timestamp, plateA: segment.name, plateB: 'Antípoda', type: 'antipode', latitude: position.antipodeLatitude, longitude: position.antipodeLongitude, angle: position.sunAngle, color: '#1d4ed8' })
    })
  })
  return crossings
}

export function isNearCrossing(timestamp: number, crossings: PlateCrossing[]) { return crossings.some((crossing) => Math.abs(timestamp - crossing.timestamp) <= 3600000) }
export function isOnPlateBoundary(latitude: number, longitude: number) { return point([longitude, latitude]) }
