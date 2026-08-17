import { haversineKm } from './earthquakes'
import type { Earthquake } from './types'

export type CrossingLike = { timestamp: number; latitude: number; longitude: number }

// Tasa relativa de eventos del paper (Marchitelli et al. 2020):
//   R = (Ec/Dc) / ((E - Ec)/(D - Dc))
// donde Ec = eventos en la condición, Dc = días en la condición.
export function eventRelativeRate(ec: number, dc: number, e: number, d: number): number {
  if (dc <= 0 || d - dc <= 0) return NaN
  const outsideRate = (e - ec) / (d - dc)
  if (outsideRate <= 0) return NaN
  return ec / dc / outsideRate
}

function lowerBound(sorted: number[], x: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < x) lo = mid + 1
    else hi = mid
  }
  return lo
}

function upperBound(sorted: number[], x: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] <= x) lo = mid + 1
    else hi = mid
  }
  return lo
}

type PreparedQuakes = { sorted: Earthquake[]; times: number[] }

function prepareQuakes(quakes: Earthquake[]): PreparedQuakes {
  const sorted = [...quakes].sort((a, b) => a.timestamp - b.timestamp)
  return { sorted, times: sorted.map((q) => q.timestamp) }
}

function countValidated(prepared: PreparedQuakes, crossings: CrossingLike[], windowMs: number, radiusKm: number): number {
  let validated = 0
  for (const c of crossings) {
    const lo = lowerBound(prepared.times, c.timestamp - windowMs)
    const hi = upperBound(prepared.times, c.timestamp + windowMs)
    for (let i = lo; i < hi; i++) {
      const q = prepared.sorted[i]
      if (haversineKm(c.latitude, c.longitude, q.latitude, q.longitude) <= radiusKm) {
        validated++
        break
      }
    }
  }
  return validated
}

// Cuántos cruces tienen al menos un sismo dentro de ±windowMs y a ≤ radiusKm.
export function countValidatedCrossings(crossings: CrossingLike[], quakes: Earthquake[], windowMs: number, radiusKm: number): number {
  return countValidated(prepareQuakes(quakes), crossings, windowMs, radiusKm)
}

export type PermutationResult = { observed: number; expected: number; p: number; iterations: number }

// Test de permutación: desplaza circularmente los cruces en el tiempo (conservando
// su espaciado relativo) y recuenta. La hipótesis nula es que el alineamiento
// temporal entre cruces y sismos es casual. p = fracción de nulos >= observado.
// Los sismos se ordenan una sola vez y se reutilizan en todas las iteraciones.
export function permutationTest(
  crossings: CrossingLike[],
  quakes: Earthquake[],
  windowMs: number,
  radiusKm: number,
  spanStart: number,
  spanEnd: number,
  iterations = 200,
): PermutationResult {
  const prepared = prepareQuakes(quakes)
  const observed = countValidated(prepared, crossings, windowMs, radiusKm)
  const span = spanEnd - spanStart
  let ge = 0
  let sum = 0
  for (let it = 0; it < iterations; it++) {
    const offset = Math.random() * span
    const shifted = crossings.map((c) => {
      const t = spanStart + ((((c.timestamp - spanStart + offset) % span) + span) % span)
      return { ...c, timestamp: t }
    })
    const count = countValidated(prepared, shifted, windowMs, radiusKm)
    sum += count
    if (count >= observed) ge++
  }
  return { observed, expected: sum / iterations, p: (ge + 1) / (iterations + 1), iterations }
}
