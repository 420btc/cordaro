import * as Astronomy from 'astronomy-engine'
import { formatUtc, type MoonPosition, type SunPosition } from './types'

const normalizeLongitude = (value: number) => ((value + 180) % 360 + 360) % 360 - 180
const observer = new Astronomy.Observer(0, 0, 0)

// Punto sublunar/subsolar: latitud = declinación, longitud = AR − tiempo sidéreo de Greenwich.
function subPointLongitude(date: Date, body: Astronomy.Body): number {
  const equator = Astronomy.Equator(body, date, observer, true, true)
  const gastDeg = Astronomy.SiderealTime(date) * 15
  return normalizeLongitude(equator.ra * 15 - gastDeg)
}

export function calculateMoonPosition(date: Date): MoonPosition {
  const equator = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true)
  const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, date, true)
  const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, date, true)
  const longitude = subPointLongitude(date, Astronomy.Body.Moon)
  const latitude = equator.dec
  const angle = Astronomy.AngleBetween(moonVec, sunVec)
  const phase = Astronomy.MoonPhase(date) / 360
  const distanceKm = Math.sqrt(moonVec.x * moonVec.x + moonVec.y * moonVec.y + moonVec.z * moonVec.z) * Astronomy.KM_PER_AU
  return {
    time: formatUtc(date),
    timestamp: date.getTime(),
    latitude,
    longitude,
    antipodeLatitude: -latitude,
    antipodeLongitude: normalizeLongitude(longitude + 180),
    sunAngle: angle,
    phase,
    distanceKm,
  }
}

export function calculateSunPosition(date: Date): SunPosition {
  const equator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true)
  const geo = Astronomy.GeoVector(Astronomy.Body.Sun, date, true)
  const distanceKm = Math.sqrt(geo.x * geo.x + geo.y * geo.y + geo.z * geo.z) * Astronomy.KM_PER_AU
  return {
    time: formatUtc(date),
    timestamp: date.getTime(),
    latitude: equator.dec,
    longitude: subPointLongitude(date, Astronomy.Body.Sun),
    distanceKm,
  }
}

export function calculateMoonPath(day: Date, stepMinutes = 15): MoonPosition[] {
  return Array.from({ length: Math.floor(1440 / stepMinutes) + 1 }, (_, index) => calculateMoonPosition(new Date(day.getTime() + index * stepMinutes * 60000)))
}

export function calculateSunPath(day: Date, stepMinutes = 15): SunPosition[] {
  return Array.from({ length: Math.floor(1440 / stepMinutes) + 1 }, (_, index) => calculateSunPosition(new Date(day.getTime() + index * stepMinutes * 60000)))
}

export function moonIllumination(phase01: number): number {
  return (1 - Math.cos(phase01 * Math.PI * 2)) / 2
}

export function moonPhaseName(phase01: number): string {
  const angle = phase01 * 360
  if (angle < 45 || angle >= 315) return 'Luna nueva'
  if (angle < 135) return 'Creciente'
  if (angle < 225) return 'Llena'
  return 'Menguante'
}
