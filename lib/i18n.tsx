'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'es' | 'en'

const es = {
  brand: 'Monitor Geofísico',
  subtitle: 'Energía entrante · UTC / 24 h',
  today: 'Hoy',
  live: 'Live',
  onlyCrossings: 'Solo cruces',
  antipode: 'Antípoda',
  animateMoon: 'Animar luna',
  pauseMoon: 'Pausar luna',
  howItWorks: 'Cómo funciona',
  exportImage: 'Exportar imagen',

  'observers.join': 'Unirse como observador',
  'observers.leave': 'Dejar de observar',
  'observers.label': 'observadores',

  'worldclocks.title': 'Relojes mundiales',
  'worldclocks.location': 'Tu ubicación',
  'worldclocks.you': 'Tú',
  'worldclocks.none': 'Sin cruces próximos',
  'worldclocks.today': 'hoy',
  'worldclocks.tomorrow': 'mañana',

  'xprofile.title': 'Richard Cordaro en X',
  'xprofile.view': 'Ver en X',
  'xprofile.followers': 'seguidores',
  'xprofile.following': 'siguiendo',
  'xprofile.posts': 'posts',

  'kpi.phase': 'Fase lunar',
  'kpi.angle': 'Ángulo Luna–Sol',
  'kpi.angleSub': 'separación angular',
  'kpi.distance': 'Distancia lunar',
  'kpi.distanceSub': 'centro a centro',
  'kpi.crossings': 'Cruces de placas',
  'kpi.crossingsSub': 'en 24 horas',
  'kpi.peak': 'Pico de energía',
  'kpi.peakOf': 'de 10',
  'kpi.quakes': 'Sismos (≥ M3)',
  'kpi.quakesSub': 'máx M',

  'phase.new': 'Luna nueva',
  'phase.waxing': 'Creciente',
  'phase.full': 'Llena',
  'phase.waning': 'Menguante',

  'crossings.title': 'Cruces de placas',
  'crossings.subtitle': 'Dónde y cuándo la Luna (o su antípoda) cruza una frontera tectónica',
  'crossings.count': '{n} cruces',
  'crossings.empty': 'Sin cruces detectados este día.',
  'crossing.next': 'Próximo cruce',
  'crossing.moonCrosses': 'La Luna cruza',
  'crossing.antipodeCrosses': 'La antípoda cruza',

  'countdown.now': 'Ahora',
  'countdown.in': 'en',
  'countdown.ago': 'hace',
  'unit.d': 'd',
  'unit.h': 'h',
  'unit.min': 'min',
  'unit.s': 's',

  'coord.lat': 'Lat',
  'coord.lon': 'Lon',
  'coord.north': 'Norte',
  'coord.south': 'Sur',
  'coord.east': 'Este',
  'coord.west': 'Oeste',

  'chart.title': 'Energía entrante por anomalía magnética',
  'chart.subtitle': 'Método de Richard Cordaro · ángulo Luna–Tierra–Sol frente al tiempo',
  'chart.legend.energy': 'Energía entrante',
  'chart.legend.rate': 'Tasa global',
  'chart.legend.level5': 'Nivel 5',
  'chart.legend.quake': 'Sismo (M)',
  'chart.axisX': 'Tiempo (UTC)',
  'chart.axisY': 'Probabilidad sísmica relativa',

  'map.loading': 'Cargando cartografía…',
  'map.aria': 'Mapa mundial de placas tectónicas y trayectoria lunar y solar',
  'map.title': 'Movimiento lunar y solar',
  'map.subtitle': '24 horas · paso 15 min',
  'map.legend': 'Leyenda',
  'map.moon': 'Luna',
  'map.sun': 'Sol',
  'map.antipode': 'Antípoda',
  'map.plateBoundary': 'Límite de placa',
  'map.moonPath': 'Trayecto lunar',
  'map.sunPath': 'Trayecto solar',
  'map.station': 'Observatorio',
  'map.crossingMoon': 'Cruce (Luna)',
  'map.crossingAntipode': 'Cruce (antípoda)',
  'map.popupAngle': 'Ángulo Luna–Sol',
  'map.popupAntipode': 'Antípoda de la Luna',
  'map.popupCrosses': 'cruza',
  'map.popupObservatory': 'Observatorio Intermagnet',

  'quakeMap.aria': 'Mapa de terremotos recientes',
  'quakeMap.title': 'Terremotos recientes',
  'quakeMap.subtitle': 'Magnitud ≥ 4 · día seleccionado',
  'quakeMap.legend': 'Magnitud',

  'info.eyebrow': 'Guía rápida',
  'info.title': '¿Qué estoy viendo?',
  'info.close': 'Cerrar',
  'info.s1.title': 'La Luna y el Sol',
  'info.s1.p1': 'La Luna tarda unos 28 días en dar una vuelta a la Tierra. Según se alinea con el Sol, vemos sus fases: nueva, creciente, llena y menguante.',
  'info.s1.p2': 'Cuando Luna, Tierra y Sol se alinean (luna nueva o llena), su atracción conjunta tira con más fuerza de la corteza terrestre.',
  'info.s2.title': 'Las placas tectónicas',
  'info.s2.p1': 'La superficie de la Tierra está partida en grandes piezas que se mueven muy despacio: las placas tectónicas.',
  'info.s2.p2': 'Donde dos placas se tocan hay una frontera (en rojo en el mapa). Ahí es donde ocurren la mayoría de los terremotos.',
  'info.s3.title': '¿Qué es un cruce?',
  'info.s3.p1': 'Un cruce es el momento exacto en que la Luna (o su punto opuesto, la antípoda) pasa justo por encima de una frontera de placas.',
  'info.s3.p2': 'Técnico: el método de Richard Cordaro relaciona la posición lunar y las alineaciones planetarias con las anomalías magnéticas y abre una ventana de riesgo de unas horas.',
  'info.s4.title': 'La energía entrante y el gráfico',
  'info.s4.p1': 'El gráfico muestra la energía entrante estimada durante el día. Cuanto más alta, mayor probabilidad relativa de sismos en esa franja.',
  'info.s4.p2': 'La línea ámbar es la energía entrante estimada y la azul la tasa global de sismos. La línea naranja marca el nivel 5 de alerta y los puntos dorados son los sismos registrados.',
  'info.s5.title': 'Cómo leer el mapa',
  'info.s5.p1': '● Luna · ● Sol · ● Antípoda · — frontera de placas.',
  'info.s5.p2': 'Las líneas discontinuas son las trayectorias de la Luna y el Sol a lo largo del día. Los puntos blancos con la hora son los cruces.',
  'info.s6.title': 'La cuenta atrás',
  'info.s6.p1': 'Cada tarjeta de cruce indica cuánto falta (en horas, minutos y segundos) o cuánto hace que ocurrió. El próximo cruce se resalta en azul.',
  'info.s7.title': 'Datos y límites',
  'info.s7.p1': 'Las posiciones de la Luna y el Sol son reales (calculadas con astronomy-engine).',
  'info.s7.p2': 'Los sismos son datos reales de USGS. La energía entrante es una estimación basada en la posición lunar y los cruces de placas; no es una predicción sísmica oficial.',

  'footer.disclaimer': 'Posiciones de la Luna y el Sol calculadas con astronomy-engine; sismos reales de USGS. La energía entrante es una estimación basada en la posición lunar y los cruces de placas.',
}

const en: Record<keyof typeof es, string> = {
  brand: 'Geophysical Monitor',
  subtitle: 'Incoming energy · UTC / 24h',
  today: 'Today',
  live: 'Live',
  onlyCrossings: 'Only crossings',
  antipode: 'Antipode',
  animateMoon: 'Animate moon',
  pauseMoon: 'Pause moon',
  howItWorks: 'How it works',
  exportImage: 'Export image',

  'observers.join': 'Join as observer',
  'observers.leave': 'Stop observing',
  'observers.label': 'observers',

  'worldclocks.title': 'World clocks',
  'worldclocks.location': 'Your location',
  'worldclocks.you': 'You',
  'worldclocks.none': 'No upcoming crossings',
  'worldclocks.today': 'today',
  'worldclocks.tomorrow': 'tomorrow',

  'xprofile.title': 'Richard Cordaro on X',
  'xprofile.view': 'View on X',
  'xprofile.followers': 'followers',
  'xprofile.following': 'following',
  'xprofile.posts': 'posts',

  'kpi.phase': 'Moon phase',
  'kpi.angle': 'Moon–Sun angle',
  'kpi.angleSub': 'angular separation',
  'kpi.distance': 'Moon distance',
  'kpi.distanceSub': 'center to center',
  'kpi.crossings': 'Plate crossings',
  'kpi.crossingsSub': 'in 24 hours',
  'kpi.peak': 'Energy peak',
  'kpi.peakOf': 'of 10',
  'kpi.quakes': 'Quakes (≥ M4)',
  'kpi.quakesSub': 'max M',

  'phase.new': 'New moon',
  'phase.waxing': 'Waxing',
  'phase.full': 'Full moon',
  'phase.waning': 'Waning',

  'crossings.title': "Today's plate crossings",
  'crossings.subtitle': 'Where and when the Moon (or its antipode) crosses a tectonic boundary',
  'crossings.count': '{n} crossings',
  'crossings.empty': 'No crossings detected this day.',
  'crossing.next': 'Next crossing',
  'crossing.moonCrosses': 'The Moon crosses',
  'crossing.antipodeCrosses': 'The antipode crosses',

  'countdown.now': 'Now',
  'countdown.in': 'in',
  'countdown.ago': 'ago',
  'unit.d': 'd',
  'unit.h': 'h',
  'unit.min': 'min',
  'unit.s': 's',

  'coord.lat': 'Lat',
  'coord.lon': 'Lon',
  'coord.north': 'North',
  'coord.south': 'South',
  'coord.east': 'East',
  'coord.west': 'West',

  'chart.title': 'Incoming energy by magnetic anomaly',
  'chart.subtitle': 'Richard Cordaro method · Moon–Earth–Sun angle vs time',
  'chart.legend.energy': 'Incoming energy',
  'chart.legend.rate': 'Global rate',
  'chart.legend.level5': 'Level 5',
  'chart.legend.quake': 'Quake (M)',
  'chart.axisX': 'Time (UTC)',
  'chart.axisY': 'Relative seismic probability',

  'map.loading': 'Loading map…',
  'map.aria': 'World map of tectonic plates and lunar and solar trajectory',
  'map.title': 'Lunar and solar movement',
  'map.subtitle': '24 hours · 15 min step',
  'map.legend': 'Legend',
  'map.moon': 'Moon',
  'map.sun': 'Sun',
  'map.antipode': 'Antipode',
  'map.plateBoundary': 'Plate boundary',
  'map.moonPath': 'Moon path',
  'map.sunPath': 'Sun path',
  'map.station': 'Observatory',
  'map.crossingMoon': 'Crossing (Moon)',
  'map.crossingAntipode': 'Crossing (antipode)',
  'map.popupAngle': 'Moon–Sun angle',
  'map.popupAntipode': "Moon's antipode",
  'map.popupCrosses': 'crosses',
  'map.popupObservatory': 'Intermagnet observatory',

  'quakeMap.aria': 'Recent earthquakes map',
  'quakeMap.title': 'Recent earthquakes',
  'quakeMap.subtitle': 'Magnitude ≥ 4 · selected day',
  'quakeMap.legend': 'Magnitude',

  'info.eyebrow': 'Quick guide',
  'info.title': 'What am I looking at?',
  'info.close': 'Close',
  'info.s1.title': 'The Moon and the Sun',
  'info.s1.p1': 'The Moon takes about 28 days to orbit the Earth. As it aligns with the Sun we see its phases: new, waxing, full and waning.',
  'info.s1.p2': "When Moon, Earth and Sun align (new or full moon), their combined pull tugs harder on the Earth's crust.",
  'info.s2.title': 'Tectonic plates',
  'info.s2.p1': "The Earth's surface is broken into large pieces that move very slowly: the tectonic plates.",
  'info.s2.p2': 'Where two plates touch there is a boundary (in red on the map). That is where most earthquakes happen.',
  'info.s3.title': 'What is a crossing?',
  'info.s3.p1': 'A crossing is the exact moment when the Moon (or its opposite point, the antipode) passes right over a plate boundary.',
  'info.s3.p2': "Technical: Richard Cordaro's method links lunar position and planetary alignments with magnetic anomalies, opening a risk window of a few hours.",
  'info.s4.title': 'Incoming energy and the chart',
  'info.s4.p1': 'The chart shows the estimated incoming energy during the day. The higher it is, the higher the relative chance of quakes in that window.',
  'info.s4.p2': 'The amber line is the estimated incoming energy and the blue one is the global quake rate. The orange line marks alert level 5 and the gold dots are recorded quakes.',
  'info.s5.title': 'How to read the map',
  'info.s5.p1': '● Moon · ● Sun · ● Antipode · — plate boundary.',
  'info.s5.p2': 'The dashed lines are the Moon and Sun paths during the day. The white dots with the time are the crossings.',
  'info.s6.title': 'The countdown',
  'info.s6.p1': 'Each crossing card shows how long until (in hours, minutes and seconds) or how long ago it happened. The next crossing is highlighted in blue.',
  'info.s7.title': 'Data and limits',
  'info.s7.p1': 'Moon and Sun positions are real (calculated with astronomy-engine).',
  'info.s7.p2': "Quakes are real USGS data. Incoming energy is an estimate based on lunar position and plate crossings; this is not an official earthquake prediction.",

  'footer.disclaimer': "Moon and Sun positions calculated with astronomy-engine; quakes are real USGS data. Incoming energy is an estimate based on lunar position and plate crossings.",
}

const dictionaries: Record<Lang, Record<keyof typeof es, string>> = { es, en }

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (params[key] !== undefined ? String(params[key]) : `{${key}}`))
}

export type TFunction = (key: keyof typeof es, params?: Record<string, string | number>) => string

type I18nContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: TFunction
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const t: I18nContextValue['t'] = (key, params) => interpolate(dictionaries[lang][key], params)
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider')
  return ctx
}
