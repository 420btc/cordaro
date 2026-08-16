'use client'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { PLATE_LABELS, PLATE_SEGMENTS, STATIONS, type MoonPosition, type PlateCrossing, type SunPosition } from '@/lib/types'

type Props = { positions: MoonPosition[]; sunPositions: SunPosition[]; crossings: PlateCrossing[]; showAntipode: boolean; animate: boolean }
const stationIcon = (code: string) => L.divIcon({ className: 'station-marker', html: `<span>${code}</span>`, iconSize: [38, 16], iconAnchor: [19, 8] })
const labelIcon = (label: string) => L.divIcon({ className: 'plate-label', html: `<span>${label}</span>`, iconSize: [120, 18], iconAnchor: [60, 9] })

function CelestialMarkers({ positions, sunPositions, animate, showAntipode }: { positions: MoonPosition[]; sunPositions: SunPosition[]; animate: boolean; showAntipode: boolean }) {
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
      <CircleMarker center={[moon.latitude, moon.longitude]} radius={17} pathOptions={{ color: '#f59e0b', fillColor: '#fde68a', fillOpacity: 0.4, weight: 2 }}>
        <Popup>Luna · {moon.time} UTC<br />Lat {moon.latitude.toFixed(1)}° / Lon {moon.longitude.toFixed(1)}°<br />Ángulo Luna–Sol {moon.sunAngle.toFixed(0)}°</Popup>
      </CircleMarker>
      <CircleMarker center={[sun.latitude, sun.longitude]} radius={13} pathOptions={{ color: '#f97316', fillColor: '#fbbf24', fillOpacity: 0.5, weight: 2 }}>
        <Popup>Sol · {sun.time} UTC<br />Lat {sun.latitude.toFixed(1)}° / Lon {sun.longitude.toFixed(1)}°</Popup>
      </CircleMarker>
      {showAntipode && (
        <CircleMarker center={[moon.antipodeLatitude, moon.antipodeLongitude]} radius={8} pathOptions={{ color: '#60a5fa', fillColor: '#1e3a8a', fillOpacity: 0.6 }}>
          <Popup>Antípoda de la Luna</Popup>
        </CircleMarker>
      )}
    </>
  )
}

export function LeafletMapInner({ positions, sunPositions, crossings, showAntipode, animate }: Props) {
  const moonPath = useMemo(() => positions.map((position) => [position.latitude, position.longitude] as [number, number]), [positions])
  const antiPath = useMemo(() => positions.map((position) => [position.antipodeLatitude, position.antipodeLongitude] as [number, number]), [positions])
  const sunPath = useMemo(() => sunPositions.map((position) => [position.latitude, position.longitude] as [number, number]), [sunPositions])

  return (
    <MapContainer center={[8, 4]} zoom={1.5} minZoom={1} maxZoom={5} scrollWheelZoom={false} worldCopyJump className="h-full w-full" attributionControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Movimiento lunar y solar</p>
        <p className="font-mono text-[10px] text-slate-400">24 horas · paso 15 min</p>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-[500] w-48 rounded-xl border border-white/10 bg-slate-950/75 p-3 text-[10px] leading-relaxed text-slate-300 backdrop-blur">
        <p className="mb-1.5 font-bold uppercase tracking-wider text-slate-400">Leyenda</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-amber-300" /> Luna</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-orange-400" /> Sol</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-blue-500" /> Antípoda</p>
        <p><i className="mr-1.5 inline-block h-0.5 w-4 rounded bg-red-500" /> Límite de placa</p>
        <p><i className="mr-1.5 inline-block w-4 border-t-2 border-dashed border-red-400" /> Trayecto lunar</p>
        <p><i className="mr-1.5 inline-block w-4 border-t-2 border-dashed border-amber-400" /> Trayecto solar</p>
        <p><i className="mr-1.5 inline-block text-red-500">▲</i> Observatorio</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full border-2 border-white bg-rose-500" /> Cruce (Luna)</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full border-2 border-white bg-blue-500" /> Cruce (antípoda)</p>
      </div>

      {PLATE_SEGMENTS.map((segment) => (
        <Polyline key={segment.name} positions={segment.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])} pathOptions={{ color: '#f43f5e', weight: 2.5, opacity: 0.9 }} />
      ))}

      <Polyline positions={moonPath} pathOptions={{ color: '#f87171', weight: 2, dashArray: '6 6' }} />
      <Polyline positions={antiPath} pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '4 6' }} />
      {sunPath.length > 0 && <Polyline positions={sunPath} pathOptions={{ color: '#fbbf24', weight: 1.5, dashArray: '2 6', opacity: 0.7 }} />}

      {crossings.map((crossing) => (
        <CircleMarker key={crossing.id} center={[crossing.latitude, crossing.longitude]} radius={7} pathOptions={{ color: '#ffffff', weight: 2, fillColor: crossing.type === 'moon' ? '#f43f5e' : '#3b82f6', fillOpacity: 0.95 }}>
          <Tooltip permanent direction="top" offset={[0, -4]}>{crossing.time}</Tooltip>
          <Popup>{crossing.type === 'moon' ? 'Luna' : 'Antípoda'} cruza {crossing.plateA}<br />{crossing.time} UTC · {crossing.angle.toFixed(0)}°</Popup>
        </CircleMarker>
      ))}

      {STATIONS.map((station) => (
        <Marker key={station.code} position={[station.latitude, station.longitude]} icon={stationIcon(station.code)}>
          <Popup>{station.name} ({station.code})<br />Observatorio Intermagnet</Popup>
        </Marker>
      ))}

      {PLATE_LABELS.map(([label, lng, lat]) => (
        <Marker key={label} position={[lat, lng]} icon={labelIcon(label)} />
      ))}

      <CelestialMarkers positions={positions} sunPositions={sunPositions} animate={animate} showAntipode={showAntipode} />
    </MapContainer>
  )
}
