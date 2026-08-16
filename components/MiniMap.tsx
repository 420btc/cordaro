'use client'
import { memo } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Props = { latitude: number; longitude: number; color: string }

export const MiniMap = memo(function MiniMap({ latitude, longitude, color }: Props) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={2} minZoom={1} maxZoom={9} scrollWheelZoom dragging zoomControl attributionControl={false} className="h-full w-full" style={{ background: '#0b1220' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }} />
    </MapContainer>
  )
})
