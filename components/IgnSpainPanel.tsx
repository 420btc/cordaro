'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { LocateFixed, MapPin } from 'lucide-react'
import { fetchIgnQuakes, ignMagColor, type IgnQuake } from '@/lib/ign'
import { haversineKm } from '@/lib/earthquakes'
import { useI18n } from '@/lib/i18n'

const IgnMap = dynamic(() => import('./IgnSpainMapInner').then((m) => m.IgnSpainMapInner), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#0e1116]" />,
})

type SortBy = 'recent' | 'nearby'

export function IgnSpainPanel() {
  const { t } = useI18n()
  const [quakes, setQuakes] = useState<IgnQuake[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { timeout: 10000, maximumAge: 600000 },
    )
  }

  useEffect(() => { requestLocation() }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetchIgnQuakes()
      .then((data) => { if (active) { setQuakes(data); setLoading(false) } })
      .catch(() => { if (active) { setError(true); setLoading(false) } })
    return () => { active = false }
  }, [])

  const sorted = useMemo(() => {
    if (!quakes) return []
    const withDistance = quakes.map((q) => ({ ...q, dist: location ? haversineKm(location.latitude, location.longitude, q.latitude, q.longitude) : null }))
    if (sortBy === 'nearby' && location) return withDistance.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
    return withDistance.sort((a, b) => b.timestamp - a.timestamp)
  }, [quakes, location, sortBy])

  const visible = sorted.slice(0, 60)

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><MapPin className="size-4 text-[#e0a028]" /> {t('ign.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('ign.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {location && (
            <span className="rounded-full border border-[#5b8db8]/50 bg-[#5b8db8]/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#5b8db8]">{t('ign.locationOn')}</span>
          )}
          <button type="button" onClick={requestLocation} className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]">
            <LocateFixed className="size-3.5" /> {t('ign.useLocation')}
          </button>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
          <button type="button" onClick={() => setSortBy('recent')} className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${sortBy === 'recent' ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('ign.recent')}</button>
          {location && <button type="button" onClick={() => setSortBy('nearby')} className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${sortBy === 'nearby' ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('ign.nearby')}</button>}
        </div>
        {quakes && !loading && <span className="font-mono text-[10px] text-[#8b94a0]">{t('ign.count', { n: quakes.length })}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="h-[420px] overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116]">
          {loading && <div className="flex h-full items-center justify-center font-mono text-xs text-[#8b94a0]">{t('ign.loading')}</div>}
          {error && <div className="flex h-full items-center justify-center px-4 text-center font-mono text-xs text-[#c0564a]">{t('ign.error')}</div>}
          {!loading && !error && quakes && <IgnMap quakes={quakes} userLocation={location} />}
        </div>

        <div className="no-scrollbar max-h-[420px] overflow-y-auto rounded-md border border-[#29313b] bg-[#0e1116]">
          {loading && <div className="flex h-full items-center justify-center p-6 font-mono text-xs text-[#8b94a0]">{t('ign.loading')}</div>}
          {error && <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-[#c0564a]">{t('ign.error')}</div>}
          {!loading && !error && visible.length === 0 && <div className="p-6 text-center font-mono text-xs text-[#8b94a0]">{t('ign.empty')}</div>}
          {!loading && !error && (
            <ul className="divide-y divide-[#29313b]">
              {visible.map((quake) => (
                <li key={quake.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex min-w-[2.5rem] items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ color: ignMagColor(quake.magnitude), background: `${ignMagColor(quake.magnitude)}18` }}>M{quake.magnitude.toFixed(1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#e7eaee]">{quake.place}</p>
                    <p className="font-mono text-[10px] text-[#8b94a0]">{quake.date} {quake.time} UTC{quake.intensity ? ` · ${quake.intensity}` : ''} · {t('ign.depth', { n: quake.depth.toFixed(0) })}</p>
                  </div>
                  {quake.dist != null && <span className="shrink-0 font-mono text-[10px] text-[#5b8db8]">{t('ign.distance', { n: Math.round(quake.dist) })}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
        <span className="flex flex-wrap items-center gap-2">
          {[4, 3, 2, 1].map((mag) => (
            <span key={mag} className="flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: ignMagColor(mag) }} /> ≥{mag}</span>
          ))}
        </span>
        <span>{t('ign.source')}</span>
      </footer>
    </section>
  )
}
