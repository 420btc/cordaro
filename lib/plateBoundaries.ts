import boundaries from './pb2002_boundaries.json'
import type { PlateSegment } from './types'

// Límites de placas reales del modelo PB2002 (Peter Bird, 2003).
// Fuente: https://github.com/fraxen/tectonicplates (GeoJSON PB2002_boundaries.json)
const PLATE_NAMES: Record<string, string> = {
  AF: 'África', AN: 'Antártida', AR: 'Arabia', AU: 'Australia', CA: 'Caribe',
  CO: 'Cocos', EU: 'Eurasia', IN: 'India', JF: 'Juan de Fuca', NZ: 'Nazca',
  NA: 'Norteamérica', PA: 'Pacífico', PS: 'Mar de Filipinas', SA: 'Sudamérica',
  AM: 'Amur', AP: 'Altiplano', AS: 'Mar Egeo', AT: 'Anatolia', BH: 'Cabeza de Pájaro',
  BR: 'Arrecife Balmoral', BS: 'Mar de Banda', BU: 'Birmania', CL: 'Carolina',
  CR: 'Arrecife Conway', EA: 'Pascua', FT: 'Futuna', GP: 'Galápagos', JZ: 'Juan Fernández',
  KE: 'Kermadec', MN: 'Manus', MO: 'Maoke', MR: 'Marianas', MS: 'Mar de las Molucas',
  NB: 'Bismarck Norte', ND: 'Andes del Norte', NH: 'Nuevas Hébridas', NI: "Niuafo'ou",
  OK: 'Ojotsk', ON: 'Okinawa', PM: 'Panamá', RI: 'Rivera', SB: 'Bismarck Sur',
  SC: 'Scotia', SL: 'Shetland', SO: 'Somalia', SS: 'Mar de Salomón', SU: 'Sonda',
  SW: 'Sandwich', TI: 'Timor', TO: 'Tonga', WL: 'Woodlark', YA: 'Yangtsé',
}

const nameFor = (code: string) => PLATE_NAMES[code] ?? (code || 'Límite')

// Fronteras notables que Richard menciona por su nombre propio.
const NOTABLE: Record<string, string> = {
  'AF-SA': 'Dorsal Mesoatlántica',
  'EU-NA': 'Dorsal Mesoatlántica',
  'AF-NA': 'Dorsal Mesoatlántica',
  'PA-AN': 'Dorsal Pacífico-Antártica',
  'PA-NZ': 'Dorsal del Pacífico Oriental',
  'PA-CO': 'Dorsal del Pacífico Oriental',
  'NA-PA': 'Falla de San Andrés',
  'NZ-SA': 'Fosa de Perú-Chile',
}

const notableFor = (a: string, b: string): string | null => NOTABLE[[a, b].sort().join('-')] ?? null

type RawBoundary = {
  geometry?: { type?: string; coordinates?: [number, number][] }
  properties?: { PlateA?: string; PlateB?: string }
}

export const PLATE_BOUNDARIES: PlateSegment[] = (boundaries as unknown as { features: RawBoundary[] }).features
  .filter((feature) => feature.geometry?.type === 'LineString' && feature.geometry.coordinates && feature.geometry.coordinates.length > 1)
  .map((feature) => {
    const a = feature.properties?.PlateA ?? ''
    const b = feature.properties?.PlateB ?? ''
    return { name: notableFor(a, b) ?? `${nameFor(a)} – ${nameFor(b)}`, coordinates: feature.geometry!.coordinates! }
  })
