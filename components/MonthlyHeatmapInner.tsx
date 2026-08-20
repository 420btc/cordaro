'use client'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { detectMonthCrossings } from '@/lib/plates'
import { PLATE_BOUNDARIES } from '@/lib/plateBoundaries'
import type { PlateCrossing } from '@/lib/types'
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

export function MonthlyHeatmapInner() {
  const { t, lang } = useI18n()
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) })
  const [crossings, setCrossings] = useState<PlateCrossing[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setCrossings(null)
    detectMonthCrossings(month.getUTCFullYear(), month.getUTCMonth()).then((res) => {
      if (active) { setCrossings(res); setLoading(false) }
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [month])

  const monthLabel = useMemo(() => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(month), [month, lang])

  const moonCount = crossings?.filter((c) => c.type === 'moon').length ?? 0
  const antiCount = crossings?.filter((c) => c.type === 'antipode').length ?? 0

  const prevMonth = () => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))
  const nextMonth = () => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))

  return (
    <div className="border-t border-[#29313b]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} aria-label={t('heat.prev')} className="flex size-8 items-center justify-center rounded border border-[#29313b] bg-[#1c232b] text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><ChevronLeft className="size-4" /></button>
          <span className="font-serif text-sm font-bold text-[#e7eaee]">{monthLabel}</span>
          <button type="button" onClick={nextMonth} aria-label={t('heat.next')} className="flex size-8 items-center justify-center rounded border border-[#29313b] bg-[#1c232b] text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><ChevronRight className="size-4" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#8b94a0]">
          {!loading && crossings && <span className="font-semibold text-[#e7eaee]">{crossings.length} {t('heat.crossings')}</span>}
          <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#c0564a]" /> {t('heat.moon')} {moonCount}</span>
          <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#5b8db8]" /> {t('heat.antipode')} {antiCount}</span>
        </div>
      </div>

      <div className="relative h-[440px] w-full overflow-hidden">
        {loading && <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#0e1116] font-mono text-xs text-[#8b94a0]">{t('heat.loading')}</div>}
        {crossings && (
          <MapContainer center={[8, 4]} zoom={1.5} minZoom={1} maxZoom={5} scrollWheelZoom={false} worldCopyJump className="h-full w-full" attributionControl={false} style={{ background: '#0e1116' }}>
            <AutoResize />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            {PLATE_BOUNDARIES.map((segment, index) => (
              <Polyline key={`${segment.name}-${index}`} positions={segment.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])} pathOptions={{ color: '#c0564a', weight: 1, opacity: 0.35 }} />
            ))}

            {crossings.map((crossing) => (
              <CircleMarker
                key={crossing.id}
                center={[crossing.latitude, crossing.longitude]}
                radius={7}
                pathOptions={{ color: crossing.type === 'moon' ? '#c0564a' : '#5b8db8', weight: 0.5, fillColor: crossing.type === 'moon' ? '#c0564a' : '#5b8db8', fillOpacity: 0.2 }}
              >
                <Tooltip direction="top" offset={[0, -4]}>
                  {crossing.time} UTC · {crossing.type === 'moon' ? t('heat.moon') : t('heat.antipode')} · {crossing.plateA}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#29313b] px-4 py-2 font-mono text-[10px] text-[#8b94a0]">
        <span className="font-serif font-bold uppercase tracking-wider text-[#8b94a0]">{t('heat.legend')}:</span>
        <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#c0564a]" /> {t('heat.moon')}</span>
        <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#5b8db8]" /> {t('heat.antipode')}</span>
        <span className="text-[#8b94a0]">· {t('heat.hint')}</span>
      </div>
    </div>
  )
}
