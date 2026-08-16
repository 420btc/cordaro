import { calculateMoonPath, calculateSunPath } from './astronomy'
import { detectPlateCrossings } from './plates'
import type { MoonPosition, PlateCrossing, SunPosition } from './types'

export function generateCelestialData(date: Date): { positions: MoonPosition[]; sunPositions: SunPosition[]; crossings: PlateCrossing[] } {
  const positions = calculateMoonPath(date)
  const sunPositions = calculateSunPath(date)
  const crossings = detectPlateCrossings(positions)
  return { positions, sunPositions, crossings }
}
