import { calculateMoonPath, calculateSunPath } from './astronomy'
import { detectPlateCrossings } from './plates'
import { generateAnomalies, generateDemoEarthquakes, type DayData } from './types'

export function generateDayData(date: Date): DayData {
  const positions = calculateMoonPath(date)
  const sunPositions = calculateSunPath(date)
  const crossings = detectPlateCrossings(positions)
  const earthquakes = generateDemoEarthquakes(date)
  const anomalies = generateAnomalies(date, crossings, earthquakes)
  return { positions, sunPositions, crossings, earthquakes, anomalies }
}
