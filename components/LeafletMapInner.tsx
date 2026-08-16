'use client'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { PLATE_LABELS, STATIONS, type MoonPosition, type PlateCrossing, type SunPosition } from '@/lib/types'
import { PLATE_BOUNDARIES } from '@/lib/plateBoundaries'
import { useI18n } from '@/lib/i18n'

type Props = { positions: MoonPosition[]; sunPositions: SunPosition[]; crossings: PlateCrossing[]; showAntipode: boolean; animate: boolean; nextCrossing?: PlateCrossing }
const stationIcon = (code: string) => L.divIcon({ className: 'station-marker', html: `<span>${code}</span>`, iconSize: [38, 16], iconAnchor: [19, 8] })
const labelIcon = (label: string) => L.divIcon({ className: 'plate-label', html: `<span>${label}</span>`, iconSize: [120, 18], iconAnchor: [60, 9] })
const pulseIcon = L.divIcon({ className: 'pulse-marker', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(el)
    const t = setTimeout(() => map.invalidateSize(), 100)
    return () => { observer.disconnect(); clearTimeout(t) }
  }, [map])
  return null
}

function CelestialMarkers({ positions, sunPositions, animate, showAntipode }: { positions: MoonPosition[]; sunPositions: SunPosition[]; animate: boolean; showAntipode: boolean }) {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!animate || positions.length === 0) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % positions.length), 700)
    return () => window.clearInterval(timer)
  }, [animate, positions.length])
  const moon = positions[Math.min(index, positions.length - 1)]
  const sun = sunPositions[Math.min(index, sunPositions.length - 1)]
  return (
    <>
      <CircleMarker center={[moon.latitude, moon.longitude]} radius={17} pathOptions={{ color: '#e0a028', fillColor: '#f0c050', fillOpacity: 0.4, weight: 2 }}>
        <Popup>{t('map.moon')} · {moon.time} UTC<br />Lat {moon.latitude.toFixed(1)}° / Lon {moon.longitude.toFixed(1)}°<br />{t('map.popupAngle')} {moon.sunAngle.toFixed(0)}°</Popup>
      </CircleMarker>
      <CircleMarker center={[sun.latitude, sun.longitude]} radius={13} pathOptions={{ color: '#d08a3a', fillColor: '#e09a4a', fillOpacity: 0.5, weight: 2 }}>
        <Popup>{t('map.sun')} · {sun.time} UTC<br />Lat {sun.latitude.toFixed(1)}° / Lon {sun.longitude.toFixed(1)}°</Popup>
      </CircleMarker>
      {showAntipode && (
        <CircleMarker center={[moon.antipodeLatitude, moon.antipodeLongitude]} radius={8} pathOptions={{ color: '#5b8db8', fillColor: '#1e3a5f', fillOpacity: 0.6 }}>
          <Popup>{t('map.popupAntipode')}</Popup>
        </CircleMarker>
      )}
    </>
  )
}

export function LeafletMapInner({ positions, sunPositions, crossings, showAntipode, animate, nextCrossing }: Props) {
  const { t } = useI18n()
  const moonPath = useMemo(() => positions.map((position) => [position.latitude, position.longitude] as [number, number]), [positions])
  const antiPath = useMemo(() => positions.map((position) => [position.antipodeLatitude, position.antipodeLongitude] as [number, number]), [positions])
  const sunPath = useMemo(() => sunPositions.map((position) => [position.latitude, position.longitude] as [number, number]), [sunPositions])

  return (
    <MapContainer center={[8, 4]} zoom={1.5} minZoom={1} maxZoom={5} scrollWheelZoom={false} worldCopyJump className="h-full w-full" attributionControl={false}>
      <AutoResize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded border border-[#29313b] bg-[#151a21]/95 px-3 py-2 shadow-sm">
        <p className="font-serif text-[12px] font-bold uppercase tracking-wider text-[#e0a028]">{t('map.title')}</p>
        <p className="font-mono text-[10px] text-[#8b94a0]">{t('map.subtitle')}</p>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-[500] w-48 rounded border border-[#29313b] bg-[#151a21]/95 p-3 text-[10px] leading-relaxed text-[#e7eaee] shadow-sm">
        <p className="mb-1.5 font-serif font-bold uppercase tracking-wider text-[#8b94a0]">{t('map.legend')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#f0c050]" /> {t('map.moon')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#e09a4a]" /> {t('map.sun')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#5b8db8]" /> {t('map.antipode')}</p>
        <p><i className="mr-1.5 inline-block h-0.5 w-4 rounded bg-[#c0564a]" /> {t('map.plateBoundary')}</p>
        <p><i className="mr-1.5 inline-block w-4 border-t-2 border-dashed border-[#e0a028]" /> {t('map.moonPath')}</p>
        <p><i className="mr-1.5 inline-block w-4 border-t-2 border-dashed border-[#d08a3a]" /> {t('map.sunPath')}</p>
        <p><i className="mr-1.5 inline-block text-[#c0564a]">▲</i> {t('map.station')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full border border-[#e7eaee] bg-[#c0564a]" /> {t('map.crossingMoon')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full border border-[#e7eaee] bg-[#5b8db8]" /> {t('map.crossingAntipode')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#e5484d]" /> {t('crossing.next')}</p>
      </div>

      {PLATE_BOUNDARIES.map((segment, index) => (
        <Polyline key={`${segment.name}-${index}`} positions={segment.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])} pathOptions={{ color: '#c0564a', weight: 1, opacity: 0.4 }} />
      ))}

      <Polyline positions={moonPath} pathOptions={{ color: '#e0a028', weight: 2, dashArray: '6 6' }} />
      <Polyline positions={antiPath} pathOptions={{ color: '#5b8db8', weight: 1.5, dashArray: '4 6' }} />
      {sunPath.length > 0 && <Polyline positions={sunPath} pathOptions={{ color: '#d08a3a', weight: 1.5, dashArray: '2 6', opacity: 0.7 }} />}

      {crossings.map((crossing) => (
        <CircleMarker key={crossing.id} center={[crossing.latitude, crossing.longitude]} radius={7} pathOptions={{ color: '#e7eaee', weight: 2, fillColor: crossing.type === 'moon' ? '#c0564a' : '#5b8db8', fillOpacity: 0.95 }}>
          <Tooltip permanent direction="top" offset={[0, -4]}>{crossing.time}</Tooltip>
          <Popup>{crossing.type === 'moon' ? t('map.moon') : t('map.antipode')} {t('map.popupCrosses')} {crossing.plateA}<br />{crossing.time} UTC · {crossing.angle.toFixed(0)}°</Popup>
        </CircleMarker>
      ))}

      {nextCrossing && (
        <Marker position={[nextCrossing.latitude, nextCrossing.longitude]} icon={pulseIcon}>
          <Popup>{t('crossing.next')} · {nextCrossing.time} UTC<br />{nextCrossing.plateA}</Popup>
        </Marker>
      )}

      {STATIONS.map((station) => (
        <Marker key={station.code} position={[station.latitude, station.longitude]} icon={stationIcon(station.code)}>
          <Popup>{station.name} ({station.code})<br />{t('map.popupObservatory')}</Popup>
        </Marker>
      ))}

      {PLATE_LABELS.map(([label, lng, lat]) => (
        <Marker key={label} position={[lat, lng]} icon={labelIcon(label)} />
      ))}

      <CelestialMarkers positions={positions} sunPositions={sunPositions} animate={animate} showAntipode={showAntipode} />
    </MapContainer>
  )
}
