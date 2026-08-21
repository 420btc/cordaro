import * as Astronomy from 'astronomy-engine'

// Índice de geometría del Sistema Solar (SSGI), inspirado en el modelo de
// SSGEOS (Solar System Geometry Survey): cuantifica la geometría angular entre
// planetas, el Sol y la Luna usando los armónicos de la onda electromagnética
// (múltiplos de 45°: 0°, 45°, 90°, 135°, 180°). Cuando varias geometrías
// críticas convergen en el tiempo, SSGEOS asocia ese momento con racimos
// temporales de sismos M≥5.5.
//
// Aproximación documentada:
//  - Planetas (Mercurio..Neptuno): longitud eclíptica HELIOCÉNTRICA
//    (EclipticLongitude). Esto permite representar la "participación de la
//    Tierra" (ej. "la Tierra alineada entre Venus y Saturno").
//  - Luna y Sol: longitud eclíptica GEOCÉNTRICA (EclipticGeoMoon / SunPosition),
//    porque la geometría lunar se mide respecto a la Tierra.
//  - Separación angular entre pares de cuerpos normalizada a [0°, 180°].
//  - Ángulos críticos: 0° y 180° (conjunción), 90° (ángulo recto),
//    45° y 135° (semi-ángulo recto).
//  - Tolerancia: ~3° si interviene la Luna, ~1° con el Sol, ~0.25° planetaria.

export type SsgiAspectType = 'conjunction' | 'square' | 'semi'

export type SsgiPeak = {
  time: string
  timestamp: number
  body: string // Mercury | Venus | Earth | Moon | Other
  partner: string
  angle: number
  type: SsgiAspectType
}

export type SsgiPoint = { time: string; timestamp: number; index: number }

export type SsgiResult = { points: SsgiPoint[]; peaks: SsgiPeak[] }

const normalize = (v: number) => ((v % 360) + 360) % 360

const angularSeparation = (a: number, b: number) => {
  const d = Math.abs(normalize(a) - normalize(b)) % 360
  return d > 180 ? 360 - d : d
}

const PLANETS: Record<string, Astronomy.Body> = {
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Earth: Astronomy.Body.Earth,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
}

const ALL_BODIES = [...Object.keys(PLANETS), 'Sun', 'Moon']

function bodyLongitude(body: string, date: Date): number {
  if (body === 'Sun') return Astronomy.SunPosition(date).elon
  if (body === 'Moon') return Astronomy.EclipticGeoMoon(date).lon
  return Astronomy.EclipticLongitude(PLANETS[body], date)
}

const CRITICAL: Array<{ angle: number; type: SsgiAspectType }> = [
  { angle: 0, type: 'conjunction' },
  { angle: 45, type: 'semi' },
  { angle: 90, type: 'square' },
  { angle: 135, type: 'semi' },
  { angle: 180, type: 'conjunction' },
]

// Cuerpos clave que SSGEOS resalta con color propio en el gráfico COMMON.
const KEY_BODIES = ['Moon', 'Earth', 'Venus', 'Mercury']

function tolerance(a: string, b: string): number {
  if (a === 'Moon' || b === 'Moon') return 3.0
  if (a === 'Sun' || b === 'Sun') return 1.0
  return 0.25
}

function weight(a: string, b: string): number {
  let w = 1
  if (a === 'Mercury' || b === 'Mercury') w *= 1.5
  if (a === 'Venus' || b === 'Venus') w *= 1.5
  if (a === 'Earth' || b === 'Earth') w *= 1.3
  if (a === 'Moon' || b === 'Moon') w *= 1.2
  return w
}

// Determina el cuerpo al que SSGEOS atribuiría el color de un pico.
function primaryBody(a: string, b: string): string | null {
  for (const key of KEY_BODIES) {
    if (a === key || b === key) return key
  }
  return null
}

// Pares a evaluar: todos los pares que incluyen al menos un cuerpo clave
// (Mercurio, Venus, Tierra o Luna). Los pares entre planetas exteriores
// contribuyen al índice SUM pero no generan picos destacados.
function buildPairs(): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < ALL_BODIES.length; i++) {
    for (let j = i + 1; j < ALL_BODIES.length; j++) {
      const a = ALL_BODIES[i]
      const b = ALL_BODIES[j]
      if (primaryBody(a, b)) pairs.push([a, b])
    }
  }
  return pairs
}

const isoTime = (date: Date) => date.toISOString().slice(0, 16)

// Calcula el SSGI para una ventana de 7 días centrada en `center` con paso de
// 30 minutos. Devuelve la serie del índice SUM y la lista de picos críticos.
export function computeSsgi(center: Date, daysHalf = 3): SsgiResult {
  const stepMs = 30 * 60000
  const start = center.getTime() - daysHalf * 86400000
  const steps = Math.floor((daysHalf * 2 * 86400000) / stepMs)

  const times: Date[] = []
  const longitudes: Record<string, number[]> = {}
  for (const body of ALL_BODIES) longitudes[body] = []

  for (let t = 0; t <= steps; t++) {
    const date = new Date(start + t * stepMs)
    times.push(date)
    for (const body of ALL_BODIES) {
      longitudes[body].push(bodyLongitude(body, date))
    }
  }

  const pairs = buildPairs()

  // Índice SUM: suma de contribuciones gaussianas de cada par y ángulo crítico.
  const raw = new Array(steps + 1).fill(0)
  for (const [a, b] of pairs) {
    const w = weight(a, b)
    const tol = tolerance(a, b)
    for (let t = 0; t <= steps; t++) {
      const sep = angularSeparation(longitudes[a][t], longitudes[b][t])
      let contribution = 0
      for (const { angle } of CRITICAL) {
        const d = sep - angle
        contribution += Math.exp(-(d * d) / (2 * tol * tol))
      }
      raw[t] += w * contribution
    }
  }

  const rawMax = Math.max(...raw, 0.0001)
  const points: SsgiPoint[] = times.map((date, t) => ({
    time: isoTime(date),
    timestamp: date.getTime(),
    index: (raw[t] / rawMax) * 10,
  }))

  // Picos: mínimos locales de la separación respecto a cada ángulo crítico
  // dentro de la tolerancia. Un pico por par y cruce.
  const peaks: SsgiPeak[] = []
  for (const [a, b] of pairs) {
    const tol = tolerance(a, b)
    for (const { angle, type } of CRITICAL) {
      for (let t = 1; t < steps; t++) {
        const rPrev = Math.abs(angularSeparation(longitudes[a][t - 1], longitudes[b][t - 1]) - angle)
        const rCur = Math.abs(angularSeparation(longitudes[a][t], longitudes[b][t]) - angle)
        const rNext = Math.abs(angularSeparation(longitudes[a][t + 1], longitudes[b][t + 1]) - angle)
        if (rCur <= tol && rCur <= rPrev && rCur <= rNext) {
          const body = primaryBody(a, b) ?? 'Other'
          peaks.push({
            time: isoTime(times[t]),
            timestamp: times[t].getTime(),
            body,
            partner: body === a ? b : a,
            angle,
            type,
          })
        }
      }
    }
  }

  return { points, peaks }
}
