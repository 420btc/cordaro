'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { toPng } from 'html-to-image'
import { AlertTriangle, CalendarDays, Clock, Compass, Globe2, Layers, Moon, Ruler, Sun, X, Zap } from 'lucide-react'
import { CordaroChart } from '@/components/CordaroChart'
import { CordaroMap } from '@/components/CordaroMap'
import { DateControls } from '@/components/DateControls'
import { dateKey, generateAnomalies, type DayData, type Earthquake, type MoonPosition, type PlateCrossing } from '@/lib/types'
import { generateCelestialData } from '@/lib/dailyData'
import { fetchEarthquakes } from '@/lib/earthquakes'
import { moonIllumination, moonPhaseKey } from '@/lib/astronomy'
import { I18nProvider, useI18n, type TFunction } from '@/lib/i18n'
import { format } from 'date-fns'

const MiniMap = dynamic(() => import('@/components/MiniMap').then((m) => m.MiniMap), { ssr: false, loading: () => <div className="h-full w-full bg-[#0b1220]" /> })

function formatDuration(ms: number, t: TFunction): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d >= 2) return `${d} ${t('unit.d')} ${h} ${t('unit.h')}`
  const totalH = Math.floor(totalSec / 3600)
  if (totalH > 0) return `${totalH} ${t('unit.h')} ${m} ${t('unit.min')} ${s} ${t('unit.s')}`
  if (m > 0) return `${m} ${t('unit.min')} ${s} ${t('unit.s')}`
  return `${s} ${t('unit.s')}`
}

function formatCountdown(timestamp: number, now: number, t: TFunction): { label: string; tone: 'now' | 'soon' | 'past' } {
  const diff = timestamp - now
  const abs = Math.abs(diff)
  if (abs < 30000) return { label: t('countdown.now'), tone: 'now' }
  const prefix = diff > 0 ? t('countdown.in') : t('countdown.ago')
  return { label: `${prefix} ${formatDuration(abs, t)}`, tone: diff > 0 ? 'soon' : 'past' }
}

function formatCoord(latitude: number, longitude: number, t: TFunction): string {
  const latDir = latitude >= 0 ? t('coord.north') : t('coord.south')
  const lonDir = longitude >= 0 ? t('coord.east') : t('coord.west')
  return `${t('coord.lat')} ${Math.abs(latitude).toFixed(0)}° ${latDir} · ${t('coord.lon')} ${Math.abs(longitude).toFixed(0)}° ${lonDir}`
}

export default function Page() {
  return <I18nProvider><Dashboard /></I18nProvider>
}

function Dashboard() {
  const { t } = useI18n()
  const [date, setDate] = useState(() => { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) })
  const [live, setLive] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [crossingsOnly, setCrossingsOnly] = useState(false)
  const [showAntipode, setShowAntipode] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const celestial = useMemo(() => generateCelestialData(date), [date])
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  useEffect(() => { let active = true; fetchEarthquakes(date).then((quakes) => { if (active) setEarthquakes(quakes) }); return () => { active = false } }, [date])
  const anomalies = useMemo(() => generateAnomalies(date, celestial.crossings, earthquakes), [date, celestial.crossings, earthquakes])
  const data = useMemo<DayData>(() => ({ positions: celestial.positions, sunPositions: celestial.sunPositions, crossings: celestial.crossings, earthquakes, anomalies }), [celestial, earthquakes, anomalies])

  useEffect(() => { if (!live) return; const timer = window.setInterval(() => setDate(new Date(dateKey(new Date()) + 'T00:00:00Z')), 300000); return () => window.clearInterval(timer) }, [live])

  const summary = useMemo(() => {
    const mid = data.positions[Math.floor(data.positions.length / 2)] ?? data.positions[0]
    const peak = data.anomalies.reduce((acc, row) => (row.energy > acc.value ? { value: row.energy, time: row.time } : acc), { value: 0, time: '' })
    const maxMag = data.earthquakes.reduce((acc, q) => Math.max(acc, q.magnitude), 0)
    return { mid, peak, maxMag }
  }, [data])

  const exportImage = async () => { if (!captureRef.current) return; const image = await toPng(captureRef.current, { pixelRatio: 2, backgroundColor: '#060a18' }); const link = document.createElement('a'); link.download = `energia-entrante-${dateKey(date)}.png`; link.href = image; link.click() }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#060a18] font-sans text-slate-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-[34rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 size-[28rem] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 size-[26rem] rounded-full bg-fuchsia-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col gap-4 p-4">
        <DateControls date={date} live={live} animate={animate} crossingsOnly={crossingsOnly} showAntipode={showAntipode} onDate={setDate} onLive={setLive} onAnimate={setAnimate} onCrossingsOnly={setCrossingsOnly} onAntipode={setShowAntipode} onExport={exportImage} onInfo={() => setShowInfo(true)} />
        <SummaryStrip data={data} summary={summary} />
        <CrossingsTimeline crossings={data.crossings} date={date} />

        <div ref={captureRef} style={{ backgroundColor: '#060a18', backgroundImage: 'radial-gradient(1100px 520px at 12% 0%, rgba(99,102,241,0.16), transparent 60%), radial-gradient(900px 480px at 88% 18%, rgba(34,211,238,0.10), transparent 55%)' }} className="flex flex-col gap-4">
          <CordaroChart data={data.anomalies} crossings={data.crossings} earthquakes={data.earthquakes} crossingsOnly={crossingsOnly} date={date} />
          <CordaroMap positions={data.positions} sunPositions={data.sunPositions} crossings={data.crossings} showAntipode={showAntipode} animate={animate} />
          <footer className="flex items-start gap-2 px-1 pb-1 text-[11px] leading-relaxed text-slate-500">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
            <span>{t('footer.disclaimer')}</span>
          </footer>
        </div>
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </main>
  )
}

function SummaryStrip({ data, summary }: { data: DayData; summary: { mid: MoonPosition; peak: { value: number; time: string }; maxMag: number } }) {
  const { t, lang } = useI18n()
  const illumination = moonIllumination(summary.mid.phase)
  const phaseName = { new: t('phase.new'), waxing: t('phase.waxing'), full: t('phase.full'), waning: t('phase.waning') }[moonPhaseKey(summary.mid.phase)]
  const items = [
    { label: t('kpi.phase'), value: `${Math.round(illumination * 100)}%`, sub: phaseName, Icon: Moon, tint: 'text-amber-300' },
    { label: t('kpi.angle'), value: `${summary.mid.sunAngle.toFixed(0)}°`, sub: t('kpi.angleSub'), Icon: Sun, tint: 'text-orange-300' },
    { label: t('kpi.distance'), value: `${Math.round(summary.mid.distanceKm).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')} km`, sub: t('kpi.distanceSub'), Icon: Ruler, tint: 'text-cyan-300' },
    { label: t('kpi.crossings'), value: `${data.crossings.length}`, sub: t('kpi.crossingsSub'), Icon: Layers, tint: 'text-rose-300' },
    { label: t('kpi.peak'), value: summary.peak.value.toFixed(1), sub: `${t('kpi.peakOf')} · ${summary.peak.time} UTC`, Icon: Zap, tint: 'text-violet-300' },
    { label: t('kpi.quakes'), value: `${data.earthquakes.length}`, sub: `${t('kpi.quakesSub')} ${summary.maxMag.toFixed(1)}`, Icon: Globe2, tint: 'text-emerald-300' },
  ]
  return (
    <section aria-label="Resumen del día" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(({ label, value, sub, Icon, tint }) => (
        <div key={label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
            <Icon className={`size-4 ${tint}`} />
          </div>
          <p className="mt-3 text-[1.9rem] font-bold leading-none tracking-tight text-white">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{sub}</p>
        </div>
      ))}
    </section>
  )
}

function CrossingsTimeline({ crossings, date }: { crossings: PlateCrossing[]; date: Date }) {
  const { t } = useI18n()
  const isToday = dateKey(date) === dateKey(new Date())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { if (!isToday) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [isToday])

  const sorted = useMemo(() => [...crossings].sort((a, b) => a.timestamp - b.timestamp), [crossings])
  const nextId = isToday ? sorted.find((crossing) => crossing.timestamp > now)?.id : undefined

  return (
    <section aria-label={t('crossings.title')} className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 backdrop-blur-xl">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white"><Clock className="size-4 text-cyan-300" /> {t('crossings.title')}</h2>
          <p className="text-xs text-slate-400">{t('crossings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"><CalendarDays className="size-3.5 text-cyan-300" /> {format(date, 'dd/MM/yyyy')}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{t('crossings.count', { n: crossings.length })}</span>
        </div>
      </header>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">{t('crossings.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {sorted.map((crossing) => <CrossingCard key={crossing.id} crossing={crossing} now={now} isNext={crossing.id === nextId} showCountdown={isToday} />)}
        </div>
      )}
    </section>
  )
}

function CrossingCard({ crossing, now, isNext, showCountdown }: { crossing: PlateCrossing; now: number; isNext: boolean; showCountdown: boolean }) {
  const { t } = useI18n()
  const isMoon = crossing.type === 'moon'
  const color = isMoon ? '#f43f5e' : '#3b82f6'
  const { label, tone } = formatCountdown(crossing.timestamp, now, t)
  const toneClass = tone === 'now' ? 'bg-amber-500/20 text-amber-200' : tone === 'soon' ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/10 text-slate-400'
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/[0.02] ${isNext ? 'border-cyan-400/60 ring-1 ring-cyan-400/40' : 'border-white/10'}`}>
      <div className="h-32 w-full overflow-hidden">
        <MiniMap latitude={crossing.latitude} longitude={crossing.longitude} color={color} />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold text-white">{crossing.time}</span>
          {showCountdown && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>{label}</span>}
        </div>
        {showCountdown && isNext && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">{t('crossing.next')}</p>}
        <p className="mt-1 text-sm font-semibold text-slate-100">{isMoon ? t('crossing.moonCrosses') : t('crossing.antipodeCrosses')}</p>
        <p className="text-xs text-slate-300">{crossing.plateA}</p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">{formatCoord(crossing.latitude, crossing.longitude, t)}</p>
      </div>
    </div>
  )
}

function InfoSection({ icon: Icon, tint, title, children }: { icon: any; tint: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><Icon className={`size-4 ${tint}`} /> {title}</h3>
      <div className="space-y-1.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  )
}

function InfoModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="no-scrollbar flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{t('info.eyebrow')}</p>
            <h2 className="text-lg font-semibold text-white">{t('info.title')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('info.close')} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </header>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <InfoSection icon={Moon} tint="text-amber-300" title={t('info.s1.title')}>
            <p>{t('info.s1.p1')}</p>
            <p className="text-slate-400">{t('info.s1.p2')}</p>
          </InfoSection>

          <InfoSection icon={Globe2} tint="text-emerald-300" title={t('info.s2.title')}>
            <p>{t('info.s2.p1')}</p>
            <p className="text-slate-400">{t('info.s2.p2')}</p>
          </InfoSection>

          <InfoSection icon={Layers} tint="text-rose-300" title={t('info.s3.title')}>
            <p>{t('info.s3.p1')}</p>
            <p className="text-slate-400">{t('info.s3.p2')}</p>
          </InfoSection>

          <InfoSection icon={Zap} tint="text-violet-300" title={t('info.s4.title')}>
            <p>{t('info.s4.p1')}</p>
            <p className="text-slate-400">{t('info.s4.p2')}</p>
          </InfoSection>

          <InfoSection icon={Compass} tint="text-cyan-300" title={t('info.s5.title')}>
            <p>{t('info.s5.p1')}</p>
            <p className="text-slate-400">{t('info.s5.p2')}</p>
          </InfoSection>

          <InfoSection icon={Clock} tint="text-amber-200" title={t('info.s6.title')}>
            <p>{t('info.s6.p1')}</p>
          </InfoSection>

          <InfoSection icon={AlertTriangle} tint="text-amber-400" title={t('info.s7.title')}>
            <p>{t('info.s7.p1')}</p>
            <p className="text-slate-400">{t('info.s7.p2')}</p>
          </InfoSection>
        </div>
      </div>
    </div>
  )
}
