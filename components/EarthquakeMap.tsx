'use client'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Earthquake, PlateCrossing } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

type Props = { earthquakes: Earthquake[]; nextCrossing?: PlateCrossing }

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

const magColor = (mag: number) => (mag >= 7 ? '#c0564a' : mag >= 5 ? '#d08a3a' : '#6aa86f')
const magRadius = (mag: number) => (mag >= 7 ? 11 : mag >= 5 ? 8 : 5)

export function EarthquakeMap({ earthquakes, nextCrossing }: Props) {
  const { t } = useI18n()
  return (
    <MapContainer center={[8, 4]} zoom={1.5} minZoom={1} maxZoom={8} scrollWheelZoom={false} worldCopyJump className="h-full w-full" attributionControl={false}>
      <AutoResize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded border border-[#29313b] bg-[#151a21]/95 px-3 py-2 shadow-sm">
        <p className="font-serif text-[12px] font-bold uppercase tracking-wider text-[#6aa86f]">{t('quakeMap.title')}</p>
        <p className="font-mono text-[10px] text-[#8b94a0]">{t('quakeMap.subtitle')}</p>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-[500] w-44 rounded border border-[#29313b] bg-[#151a21]/95 p-3 text-[10px] leading-relaxed text-[#e7eaee] shadow-sm">
        <p className="mb-1.5 font-serif font-bold uppercase tracking-wider text-[#8b94a0]">{t('quakeMap.legend')}</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#6aa86f]" /> M &lt; 5</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#d08a3a]" /> M 5–6.9</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full bg-[#c0564a]" /> M ≥ 7</p>
        <p><i className="mr-1.5 inline-block size-2 rounded-full border border-[#e7eaee] bg-[#e5484d]" /> {t('crossing.next')}</p>
      </div>

      {earthquakes.map((quake) => (
        <CircleMarker key={quake.id} center={[quake.latitude, quake.longitude]} radius={magRadius(quake.magnitude)} pathOptions={{ color: magColor(quake.magnitude), fillColor: magColor(quake.magnitude), fillOpacity: 0.75, weight: 1.5 }}>
          <Tooltip direction="top" offset={[0, -6]}>M {quake.magnitude.toFixed(1)} · {quake.place}</Tooltip>
          <Popup>M {quake.magnitude.toFixed(1)} · {quake.place}<br />{quake.depth.toFixed(0)} km · {quake.time} UTC</Popup>
        </CircleMarker>
      ))}

      {nextCrossing && (
        <Marker position={[nextCrossing.latitude, nextCrossing.longitude]} icon={pulseIcon}>
          <Tooltip direction="top" offset={[0, -6]}>{t('crossing.next')} · {nextCrossing.time} UTC</Tooltip>
          <Popup>{t('crossing.next')} · {nextCrossing.time} UTC<br />{nextCrossing.plateA}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
