export type Observatory = { code: string; name: string; latitude: number; longitude: number }

// 9 observatorios INTERMAGNET repartidos estratégicamente por el mundo.
export const OBSERVATORIES: Observatory[] = [
  { code: 'TUC', name: 'Tucson', latitude: 32.17, longitude: -110.73 },
  { code: 'FRD', name: 'Fredericksburg', latitude: 38.20, longitude: -77.37 },
  { code: 'VSS', name: 'Vassouras', latitude: -22.40, longitude: -43.65 },
  { code: 'HER', name: 'Hermanus', latitude: -34.43, longitude: 19.23 },
  { code: 'FUR', name: 'Fürstenfeldbruck', latitude: 48.17, longitude: 11.28 },
  { code: 'HYB', name: 'Hyderabad', latitude: 17.42, longitude: 78.55 },
  { code: 'KNY', name: 'Kanoya', latitude: 31.42, longitude: 130.88 },
  { code: 'GUA', name: 'Guam', latitude: 13.59, longitude: 144.87 },
  { code: 'CTA', name: 'Canberra', latitude: -35.32, longitude: 149.36 },
]
