'use client'
import { memo, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Props = { latitude: number; longitude: number; color: string }

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

export const MiniMap = memo(function MiniMap({ latitude, longitude, color }: Props) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={2} minZoom={1} maxZoom={18} scrollWheelZoom dragging zoomControl attributionControl={false} className="h-full w-full" style={{ background: '#0e1116' }}>
      <AutoResize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }} />
    </MapContainer>
  )
})
