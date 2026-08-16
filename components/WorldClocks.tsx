'use client'
import { useEffect, useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { PlateCrossing } from '@/lib/types'

type City = { name: string; tz: string }

const CITIES: City[] = [
  { name: 'Londres', tz: 'Europe/London' },
  { name: 'Madrid', tz: 'Europe/Madrid' },
  { name: 'Nueva York', tz: 'America/New_York' },
  { name: 'Los Ángeles', tz: 'America/Los_Angeles' },
  { name: 'Tokio', tz: 'Asia/Tokyo' },
  { name: 'Sídney', tz: 'Australia/Sydney' },
  { name: 'Shanghái', tz: 'Asia/Shanghai' },
  { name: 'UTC', tz: 'UTC' },
]

const fmtTime = (ms: number, tz: string, withSeconds: boolean) =>
  new Date(ms).toLocaleTimeString('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hour12: false })

function detectHomeTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'Europe/Madrid' }
}

export function WorldClocks({ nextCrossing }: { nextCrossing?: PlateCrossing }) {
  const { t } = useI18n()
  const [home, setHome] = useState(() => CITIES.find((c) => c.tz === detectHomeTz())?.tz ?? 'Europe/Madrid')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const dayTag = nextCrossing
    ? (() => {
        const d = new Date(nextCrossing.timestamp)
        const n = new Date(now)
        return d.getUTCFullYear() === n.getUTCFullYear() && d.getUTCMonth() === n.getUTCMonth() && d.getUTCDate() === n.getUTCDate()
          ? t('worldclocks.today') : t('worldclocks.tomorrow')
      })()
    : ''

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Clock className="size-4 text-[#e0a028]" /> {t('worldclocks.title')}</h2>
        <label className="flex items-center gap-2 text-xs text-[#8b94a0]">
          <MapPin className="size-4 text-[#e0a028]" />
          <span>{t('worldclocks.location')}</span>
          <select value={home} onChange={(event) => setHome(event.target.value)} className="rounded border border-[#29313b] bg-[#1c232b] px-2 py-1 font-mono text-xs text-[#e7eaee] [color-scheme:dark]">
            {CITIES.map((city) => <option key={city.tz} value={city.tz}>{city.name}</option>)}
          </select>
        </label>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
        {CITIES.map((city) => {
          const isHome = city.tz === home
          return (
            <div key={city.tz} className={`rounded-md border p-3 text-center ${isHome ? 'border-[#e0a028]/60 bg-[#e0a028]/5 ring-1 ring-[#e0a028]/30' : 'border-[#29313b] bg-[#1c232b]'}`}>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b94a0]">
                <span>{city.name}</span>
                {isHome && <span className="rounded bg-[#e0a028] px-1 py-0.5 text-[8px] font-bold leading-none text-[#0e1116]">{t('worldclocks.you')}</span>}
              </div>
              <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#e7eaee]">{fmtTime(now, city.tz, true)}</p>
              {nextCrossing ? (
                <p className="mt-1.5 text-[10px] leading-tight text-[#8b94a0]">
                  <span className="text-[#e0a028]">{t('crossing.next')}</span> {fmtTime(nextCrossing.timestamp, city.tz, false)}
                  <span className="ml-1 rounded bg-[#29313b] px-1 text-[8px] uppercase text-[#8b94a0]">{dayTag}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-[10px] text-[#8b94a0]">{t('worldclocks.none')}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
