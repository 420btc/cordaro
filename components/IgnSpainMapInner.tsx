'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ignMagColor, type IgnQuake } from '@/lib/ign'
import { useI18n } from '@/lib/i18n'

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

export function IgnSpainMapInner({ quakes, userLocation }: { quakes: IgnQuake[]; userLocation: { latitude: number; longitude: number } | null }) {
  const { t } = useI18n()
  const center: [number, number] = userLocation ? [userLocation.latitude, userLocation.longitude] : [40, -4]
  const zoom = userLocation ? 7 : 5

  return (
    <MapContainer center={center} zoom={zoom} minZoom={2} maxZoom={14} scrollWheelZoom={false} worldCopyJump className="h-full w-full" attributionControl={false} style={{ background: '#0e1116' }}>
      <AutoResize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {quakes.map((quake) => (
        <CircleMarker
          key={quake.id}
          center={[quake.latitude, quake.longitude]}
          radius={Math.max(4, quake.magnitude * 2.2)}
          pathOptions={{ color: ignMagColor(quake.magnitude), weight: 1, fillColor: ignMagColor(quake.magnitude), fillOpacity: 0.55 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            M{quake.magnitude.toFixed(1)} · {quake.place}<br />{quake.date} {quake.time} UTC · {t('ign.depth', { n: quake.depth.toFixed(0) })}
          </Tooltip>
        </CircleMarker>
      ))}

      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{ color: '#5b8db8', weight: 2, fillColor: '#5b8db8', fillOpacity: 0.9 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>{t('ign.you')}</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  )
}
