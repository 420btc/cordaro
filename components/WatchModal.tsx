'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Clock, Radar, X, XCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fetchEarthquakesWindow, nearestQuakeWithin } from '@/lib/earthquakes'
import { addWatched } from '@/lib/watchStore'
import type { Earthquake, PlateCrossing } from '@/lib/types'

const WINDOW_MIN = 10
const RADIUS_KM = 100
const POLL_MS = 10000

export function WatchModal({ crossing, onClose }: { crossing: PlateCrossing; onClose: () => void }) {
  const { t } = useI18n()
  const [quakes, setQuakes] = useState<Earthquake[]>([])
  const [now, setNow] = useState(() => Date.now())
  const savedRef = useRef(false)

  const start = crossing.timestamp - WINDOW_MIN * 60000
  const end = crossing.timestamp + WINDOW_MIN * 60000

  useEffect(() => {
    let active = true
    const poll = async () => {
      const qs = await fetchEarthquakesWindow(new Date(start), new Date(end), 1)
      if (active) setQuakes(qs)
    }
    poll()
    const pollTimer = window.setInterval(poll, POLL_MS)
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    return () => { active = false; window.clearInterval(pollTimer); window.clearInterval(clock) }
  }, [start, end])

  const nearest = useMemo(() => nearestQuakeWithin(crossing.latitude, crossing.longitude, quakes, RADIUS_KM), [quakes, crossing])

  const finished = now >= end
  const remainingMin = Math.max(0, Math.ceil((end - now) / 60000))

  const save = () => {
    if (savedRef.current) return
    savedRef.current = true
    addWatched({
      id: crossing.id,
      time: crossing.time,
      timestamp: crossing.timestamp,
      latitude: crossing.latitude,
      longitude: crossing.longitude,
      type: crossing.type,
      plateA: crossing.plateA,
      color: crossing.color,
      result: nearest ? { magnitude: nearest.quake.magnitude, distanceKm: Math.round(nearest.distanceKm), place: nearest.quake.place } : null,
      savedAt: Date.now(),
    })
  }

  const close = () => { save(); onClose() }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div className="w-full max-w-md rounded-md border border-[#29313b] bg-[#0e1116] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded bg-[#e0a028] text-[#0e1116]"><Radar className="size-5" /></div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#e7eaee]">{t('watch.title')}</h2>
              <p className="text-xs text-[#8b94a0]">{t('watch.subtitle')}</p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label={t('info.close')} className="rounded p-1.5 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-5" /></button>
        </header>

        <div className="space-y-3">
          <div className="rounded-md border border-[#29313b] bg-[#151a21] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-bold text-[#e7eaee]">{crossing.time}</span>
              <span className="rounded-full border border-[#e0a028]/50 bg-[#e0a028]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#e0a028]">{crossing.plateA}</span>
            </div>
            <p className="mt-1 font-serif text-sm font-semibold text-[#e7eaee]">{crossing.type === 'moon' ? t('crossing.moonCrosses') : t('crossing.antipodeCrosses')}</p>
            <p className="mt-1 font-mono text-[10px] text-[#8b94a0]">{crossing.latitude.toFixed(1)}°, {crossing.longitude.toFixed(1)}°</p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-[#29313b] bg-[#151a21] px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]"><Clock className="size-3.5" /> {t('watch.until')} {format(new Date(end), 'HH:mm')} UTC</span>
            {finished ? (
              <span className="font-mono text-xs font-bold text-[#8b94a0]">{t('watch.closed')}</span>
            ) : (
              <span className="animate-pulse font-mono text-xs font-bold text-[#e0a028]">{t('watch.monitoring')} · {remainingMin} min</span>
            )}
          </div>

          {nearest ? (
            <div className="flex items-center gap-2 rounded-md border border-[#6aa86f]/50 bg-[#6aa86f]/10 p-3">
              <CheckCircle2 className="size-5 text-[#6aa86f]" />
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-[#6aa86f]">{t('watch.quakeFound', { magnitude: nearest.quake.magnitude.toFixed(1), dist: nearest.distanceKm })}</p>
                <p className="truncate text-[10px] text-[#8b94a0]">{nearest.quake.place}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-[#29313b] bg-[#151a21] p-3">
              <XCircle className="size-5 text-[#8b94a0]" />
              <p className="font-mono text-xs text-[#8b94a0]">{finished ? t('watch.noQuake') : t('watch.monitoring')}</p>
            </div>
          )}

          <button type="button" onClick={close} className="w-full rounded-md bg-[#e0a028] px-4 py-2 text-sm font-bold text-[#0e1116] hover:bg-[#f0b940]">{t('watch.close')}</button>
        </div>
      </div>
    </div>
  )
}
