import * as Astronomy from 'astronomy-engine'
import { formatUtc } from './types'

export type PlanetAlignmentType = 'conjunction' | 'square' | 'opposition'
export type PlanetAspect = { planet: string; angle: number; type: PlanetAlignmentType | null; time: string; timestamp: number }

export const ALIGNMENT_SYMBOL: Record<PlanetAlignmentType, string> = {
  conjunction: '☌',
  square: '□',
  opposition: '☍',
}

const BODIES: { name: string; body: Astronomy.Body }[] = [
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
]

function moonPlanetAngle(body: Astronomy.Body, time: Date): number {
  const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
  const planetVec = Astronomy.GeoVector(body, time, true)
  return Astronomy.AngleBetween(moonVec, planetVec)
}

// Para cada planeta devuelve el aspecto Luna–planeta del día: conjunción (0°),
// cuadratura (90°) u oposición (180°). Si no hay aspecto exacto, muestra el ángulo
// al mediodía UTC para que la sección siempre tenga contenido.
export function calculatePlanetAspects(day: Date, stepMinutes = 15): PlanetAspect[] {
  const steps = Math.floor(1440 / stepMinutes)
  const noon = new Date(day.getTime() + 12 * 3600000)
  const aspects: PlanetAspect[] = []

  for (const { name, body } of BODIES) {
    const angles: number[] = []
    const times: Date[] = []
    for (let i = 0; i <= steps; i++) {
      const time = new Date(day.getTime() + i * stepMinutes * 60000)
      angles.push(moonPlanetAngle(body, time))
      times.push(time)
    }

    let minAngle = Infinity
    let minIdx = -1
    let maxAngle = -Infinity
    let maxIdx = -1
    for (let i = 0; i < angles.length; i++) {
      if (angles[i] < minAngle) { minAngle = angles[i]; minIdx = i }
      if (angles[i] > maxAngle) { maxAngle = angles[i]; maxIdx = i }
    }

    let squareIdx = -1
    for (let i = 1; i < angles.length; i++) {
      if ((angles[i - 1] < 90 && angles[i] >= 90) || (angles[i - 1] > 90 && angles[i] <= 90)) { squareIdx = i; break }
    }

    if (minAngle <= 12) {
      aspects.push({ planet: name, angle: minAngle, type: 'conjunction', time: formatUtc(times[minIdx]), timestamp: times[minIdx].getTime() })
    } else if (maxAngle >= 168) {
      aspects.push({ planet: name, angle: maxAngle, type: 'opposition', time: formatUtc(times[maxIdx]), timestamp: times[maxIdx].getTime() })
    } else if (squareIdx >= 0) {
      aspects.push({ planet: name, angle: angles[squareIdx], type: 'square', time: formatUtc(times[squareIdx]), timestamp: times[squareIdx].getTime() })
    } else {
      aspects.push({ planet: name, angle: moonPlanetAngle(body, noon), type: null, time: formatUtc(noon), timestamp: noon.getTime() })
    }
  }

  return aspects
}
