'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { toPng } from 'html-to-image'
import { AlertTriangle, Binoculars, CalendarDays, CheckCircle2, Clock, Compass, Globe2, Info, Layers, Monitor, Moon, Ruler, Sun, X, XCircle, Zap } from 'lucide-react'
import { CordaroChart } from '@/components/CordaroChart'
import { CordaroMap } from '@/components/CordaroMap'
import { DateControls } from '@/components/DateControls'
import { WorldClocks } from '@/components/WorldClocks'
import { XProfile } from '@/components/XProfile'
import { IntermagnetPanel } from '@/components/IntermagnetPanel'
import { dateKey, generateAnomalies, type DayData, type Earthquake, type MoonPosition, type PlateCrossing } from '@/lib/types'
import { generateCelestialData } from '@/lib/dailyData'
import { fetchEarthquakes, nearestQuakeWithin } from '@/lib/earthquakes'
import { computeCoincidences } from '@/lib/coincidences'
import { moonIllumination, moonPhaseKey } from '@/lib/astronomy'
import { I18nProvider, useI18n, type TFunction } from '@/lib/i18n'
import { format } from 'date-fns'

const MiniMap = dynamic(() => import('@/components/MiniMap').then((m) => m.MiniMap), { ssr: false, loading: () => <div className="h-full w-full bg-[#0e1116]" /> })
const EarthquakeMap = dynamic(() => import('@/components/EarthquakeMap').then((m) => m.EarthquakeMap), { ssr: false, loading: () => <div className="h-full w-full bg-[#0e1116]" /> })

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

let audioContext: AudioContext | null = null

function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const Ctx = w.AudioContext ?? w.webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

function playBeep(frequency: number) {
  const ctx = ensureAudio()
  if (!ctx || ctx.state !== 'running') return
  try {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.45)
  } catch {
    // audio bloqueado por el navegador; se ignora
  }
}

const BEEP_FREQ = [880, 660, 440] // 1 min, 5 min, 10 min

function crossingAlertLevel(remainingMs: number): number {
  if (remainingMs <= 60000) return 0
  if (remainingMs <= 300000) return 1
  if (remainingMs <= 600000) return 2
  return 3
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
  const [showMobileNotice, setShowMobileNotice] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const celestial = useMemo(() => generateCelestialData(date), [date])
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  useEffect(() => { let active = true; fetchEarthquakes(date).then((quakes) => { if (active) setEarthquakes(quakes) }); return () => { active = false } }, [date])
  const [coincidences, setCoincidences] = useState<Record<string, number>>({})
  const [coincidencesLoading, setCoincidencesLoading] = useState(true)
  useEffect(() => { let active = true; computeCoincidences(15).then((res) => { if (active) { setCoincidences(res); setCoincidencesLoading(false) } }); return () => { active = false } }, [])
  const anomalies = useMemo(() => generateAnomalies(date, celestial.crossings, earthquakes), [date, celestial.crossings, earthquakes])
  const data = useMemo<DayData>(() => ({ positions: celestial.positions, sunPositions: celestial.sunPositions, crossings: celestial.crossings, earthquakes, anomalies }), [celestial, earthquakes, anomalies])

  useEffect(() => { if (!live) return; const timer = window.setInterval(() => setDate(new Date(dateKey(new Date()) + 'T00:00:00Z')), 300000); return () => window.clearInterval(timer) }, [live])

  const summary = useMemo(() => {
    const mid = data.positions[Math.floor(data.positions.length / 2)] ?? data.positions[0]
    const peak = data.anomalies.reduce((acc, row) => (row.energy > acc.value ? { value: row.energy, time: row.time } : acc), { value: 0, time: '' })
    const maxMag = data.earthquakes.reduce((acc, q) => Math.max(acc, q.magnitude), 0)
    return { mid, peak, maxMag }
  }, [data])

  const nextCrossing = useMemo(() => {
    if (data.crossings.length === 0) return undefined
    const sorted = [...data.crossings].sort((a, b) => a.timestamp - b.timestamp)
    const now = Date.now()
    return sorted.find((crossing) => crossing.timestamp > now) ?? sorted[0]
  }, [data.crossings])

  const tomorrowCrossings = useMemo(() => generateCelestialData(new Date(date.getTime() + 86400000)).crossings, [date])
  const [crossingTick, setCrossingTick] = useState(0)
  const nextUpcomingCrossing = useMemo(() => {
    const now = Date.now()
    return [...data.crossings, ...tomorrowCrossings]
      .filter((crossing) => crossing.timestamp > now)
      .sort((a, b) => a.timestamp - b.timestamp)[0]
  }, [data.crossings, tomorrowCrossings, crossingTick])

  // Cuando el próximo cruce pasa, se fuerza un recálculo para saltar al siguiente.
  useEffect(() => {
    if (!nextUpcomingCrossing) return
    const delay = nextUpcomingCrossing.timestamp - Date.now()
    if (delay <= 0) return
    const timer = window.setTimeout(() => setCrossingTick((k) => k + 1), delay + 1000)
    return () => window.clearTimeout(timer)
  }, [nextUpcomingCrossing])

  const beepStateRef = useRef<{ timestamp: number; level: number }>({ timestamp: 0, level: 3 })

  useEffect(() => {
    const unlock = () => ensureAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 768px)').matches) setShowMobileNotice(true)
  }, [])

  useEffect(() => {
    if (!nextCrossing) return
    const timer = window.setInterval(() => {
      const remaining = nextCrossing.timestamp - Date.now()
      if (remaining <= 0) return
      if (beepStateRef.current.timestamp !== nextCrossing.timestamp) {
        beepStateRef.current = { timestamp: nextCrossing.timestamp, level: 3 }
      }
      const level = crossingAlertLevel(remaining)
      if (level < beepStateRef.current.level) playBeep(BEEP_FREQ[level])
      beepStateRef.current.level = level
    }, 1000)
    return () => window.clearInterval(timer)
  }, [nextCrossing])

  const exportImage = async () => { if (!captureRef.current) return; const image = await toPng(captureRef.current, { pixelRatio: 2, backgroundColor: '#0e1116' }); const link = document.createElement('a'); link.download = `energia-entrante-${dateKey(date)}.png`; link.href = image; link.click() }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0e1116] font-sans text-[#e7eaee]">
      <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col gap-4 p-4">
        <DateControls date={date} live={live} animate={animate} crossingsOnly={crossingsOnly} showAntipode={showAntipode} onDate={setDate} onLive={setLive} onAnimate={setAnimate} onCrossingsOnly={setCrossingsOnly} onAntipode={setShowAntipode} onExport={exportImage} onInfo={() => setShowInfo(true)} coincidences={coincidences} coincidencesLoading={coincidencesLoading} />
        <XProfile />
        <WorldClocks nextCrossing={nextUpcomingCrossing} />
        <SummaryStrip data={data} summary={summary} />
        <CrossingsTimeline crossings={data.crossings} date={date} earthquakes={data.earthquakes} />

        <div ref={captureRef} className="flex flex-col gap-4">
          <CordaroChart data={data.anomalies} crossings={data.crossings} earthquakes={data.earthquakes} crossingsOnly={crossingsOnly} date={date} />
          <CordaroMap positions={data.positions} sunPositions={data.sunPositions} crossings={data.crossings} showAntipode={showAntipode} animate={animate} nextCrossing={nextCrossing} />
          <section aria-label={t('quakeMap.aria')} className="h-[42vh] min-h-[380px] shrink-0 overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116]">
            <EarthquakeMap earthquakes={data.earthquakes} nextCrossing={nextUpcomingCrossing} />
          </section>
          <footer className="flex items-start gap-2 px-1 pb-1 text-[11px] leading-relaxed text-[#8b94a0]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#e0a028]" />
            <span>{t('footer.disclaimer')}</span>
          </footer>
        </div>

        <IntermagnetPanel />
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {showMobileNotice && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md border border-[#29313b] bg-[#151a21] p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex size-9 items-center justify-center rounded bg-[#e0a028] text-[#0e1116]"><Monitor className="size-5" /></div>
              <button type="button" onClick={() => setShowMobileNotice(false)} aria-label={t('mobile.close')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-5" /></button>
            </div>
            <h2 className="font-serif text-base font-bold text-[#e7eaee]">{t('mobile.title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#c5ccd4]">{t('mobile.body')}</p>
            <button type="button" onClick={() => setShowMobileNotice(false)} className="mt-4 w-full rounded-md bg-[#e0a028] px-4 py-2 text-sm font-bold text-[#0e1116] hover:bg-[#f0b940]">{t('mobile.close')}</button>
          </div>
        </div>
      )}
    </main>
  )
}

function SummaryStrip({ data, summary }: { data: DayData; summary: { mid: MoonPosition; peak: { value: number; time: string }; maxMag: number } }) {
  const { t, lang } = useI18n()
  const illumination = moonIllumination(summary.mid.phase)
  const phaseName = { new: t('phase.new'), waxing: t('phase.waxing'), full: t('phase.full'), waning: t('phase.waning') }[moonPhaseKey(summary.mid.phase)]
  const items = [
    { label: t('kpi.phase'), value: `${Math.round(illumination * 100)}%`, sub: phaseName, Icon: Moon, tint: 'text-[#e0a028]' },
    { label: t('kpi.angle'), value: `${summary.mid.sunAngle.toFixed(0)}°`, sub: t('kpi.angleSub'), Icon: Sun, tint: 'text-[#d08a3a]' },
    { label: t('kpi.distance'), value: `${Math.round(summary.mid.distanceKm).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')} km`, sub: t('kpi.distanceSub'), Icon: Ruler, tint: 'text-[#5b8db8]' },
    { label: t('kpi.crossings'), value: `${data.crossings.length}`, sub: t('kpi.crossingsSub'), Icon: Layers, tint: 'text-[#8b94a0]' },
    { label: t('kpi.peak'), value: summary.peak.value.toFixed(1), sub: `${t('kpi.peakOf')} · ${summary.peak.time} UTC`, Icon: Zap, tint: 'text-[#e0a028]' },
    { label: t('kpi.quakes'), value: `${data.earthquakes.length}`, sub: `${t('kpi.quakesSub')} ${summary.maxMag.toFixed(1)}`, Icon: Globe2, tint: 'text-[#6aa86f]' },
  ]
  return (
    <section aria-label="Resumen del día" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(({ label, value, sub, Icon, tint }) => (
        <div key={label} className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8b94a0]">{label}</span>
            <Icon className={`size-4 ${tint}`} />
          </div>
          <p className="mt-3 font-serif text-[2rem] font-bold leading-none text-[#e7eaee]">{value}</p>
          <p className="mt-2 text-xs text-[#8b94a0]">{sub}</p>
        </div>
      ))}
    </section>
  )
}

function CrossingsTimeline({ crossings, date, earthquakes }: { crossings: PlateCrossing[]; date: Date; earthquakes: Earthquake[] }) {
  const { t } = useI18n()
  const isToday = dateKey(date) === dateKey(new Date())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { if (!isToday) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [isToday])

  const sorted = useMemo(() => [...crossings].sort((a, b) => a.timestamp - b.timestamp), [crossings])
  const nextId = isToday ? sorted.find((crossing) => crossing.timestamp > now)?.id : undefined

  return (
    <section aria-label={t('crossings.title')} className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Clock className="size-4 text-[#e0a028]" /> {t('crossings.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('crossings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#29313b] bg-[#1c232b] px-3 py-1 text-xs font-semibold text-[#e7eaee]"><CalendarDays className="size-3.5 text-[#e0a028]" /> {format(date, 'dd/MM/yyyy')}</span>
          <span className="rounded-full border border-[#29313b] bg-[#1c232b] px-3 py-1 text-xs font-semibold text-[#e7eaee]">{t('crossings.count', { n: crossings.length })}</span>
        </div>
      </header>
      {sorted.length === 0 ? (
        <p className="text-sm text-[#8b94a0]">{t('crossings.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {sorted.map((crossing) => <CrossingCard key={crossing.id} crossing={crossing} now={now} isNext={crossing.id === nextId} showCountdown={isToday} earthquakes={earthquakes} />)}
        </div>
      )}
    </section>
  )
}

function CrossingCard({ crossing, now, isNext, showCountdown, earthquakes }: { crossing: PlateCrossing; now: number; isNext: boolean; showCountdown: boolean; earthquakes: Earthquake[] }) {
  const { t } = useI18n()
  const isMoon = crossing.type === 'moon'
  const color = isMoon ? '#c0564a' : '#5b8db8'
  const { label, tone } = formatCountdown(crossing.timestamp, now, t)
  const nearby = nearestQuakeWithin(crossing.latitude, crossing.longitude, earthquakes, 100)
  const validated = nearby != null
  const isPast = crossing.timestamp <= now
  const badgeClass = tone === 'now' ? 'bg-[#e0a028] text-[#0e1116] ring-2 ring-[#e0a028]/40 animate-pulse' : tone === 'soon' ? 'bg-[#5b8db8] text-white ring-2 ring-[#5b8db8]/40' : 'bg-[#29313b] text-[#8b94a0]'
  const [following, setFollowing] = useState(false)
  const observers = following ? 1 : 0
  return (
    <div className={`flex-[1_1_280px] min-w-[260px] overflow-hidden rounded-md border bg-[#151a21] shadow-sm ${isNext ? 'border-[#e0a028] ring-2 ring-[#e0a028]/40 shadow-[0_0_22px_rgba(224,160,40,0.28)]' : 'border-[#29313b]'}`}>
      <div className={`relative h-32 w-full overflow-hidden border-b ${isNext ? 'border-[#e0a028]/60' : 'border-[#29313b]'}`}>
        <MiniMap latitude={crossing.latitude} longitude={crossing.longitude} color={color} />
        {isNext && (
          <>
            <span className="pointer-events-none absolute inset-0 z-[500] animate-pulse ring-2 ring-inset ring-[#e0a028]" />
            <span className="absolute left-2 top-2 z-[500] rounded-full bg-[#e0a028] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#0e1116] shadow-sm">{t('crossing.nextShort')}</span>
          </>
        )}
        {isPast && (
          <div className="absolute right-2 top-2 z-[500]">
            <div className="group relative">
              <div className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 backdrop-blur-sm ${validated ? 'border-[#6aa86f]/50 bg-[#0e1116]/85' : 'border-[#c0564a]/50 bg-[#0e1116]/85'}`}>
                {validated ? <CheckCircle2 className="size-3.5 text-[#6aa86f]" /> : <XCircle className="size-3.5 text-[#c0564a]" />}
                <Info className="size-3 text-[#8b94a0]" />
              </div>
              <div className="pointer-events-none absolute right-0 top-7 z-[600] hidden w-48 rounded border border-[#29313b] bg-[#151a21] p-2 text-[10px] leading-relaxed text-[#e7eaee] shadow-md group-hover:block">
                <p className="mb-1 font-mono uppercase tracking-wide text-[#8b94a0]">{t('crossing.info')}</p>
                <p className={validated ? 'text-[#6aa86f]' : 'text-[#c0564a]'}>
                  {validated && nearby ? t('crossing.validated', { magnitude: nearby.quake.magnitude.toFixed(1), dist: Math.round(nearby.distanceKm) }) : t('crossing.notValidated')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold text-[#e7eaee]">{crossing.time}</span>
          {showCountdown && <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}>{label}</span>}
        </div>
        {showCountdown && isNext && <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#e0a028]">{t('crossing.next')}</p>}
        <p className="mt-1 font-serif text-sm font-semibold text-[#e7eaee]">{isMoon ? t('crossing.moonCrosses') : t('crossing.antipodeCrosses')}</p>
        <p className="text-xs text-[#8b94a0]">{crossing.plateA}</p>
        <p className="mt-2 font-mono text-[10px] text-[#8b94a0]">{formatCoord(crossing.latitude, crossing.longitude, t)}</p>
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setFollowing((value) => !value)}
            aria-pressed={following}
            aria-label={following ? t('observers.leave') : t('observers.join')}
            title={`${observers} ${t('observers.label')}`}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-sm ${following ? 'border-[#e0a028]/70 bg-[#e0a028]/10 text-[#e0a028]' : 'border-[#29313b] bg-[#1c232b] text-[#8b94a0] hover:text-[#e7eaee]'}`}
          >
            <Binoculars className="size-3.5" />
            <span className="font-mono tabular-nums">{observers}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoSection({ icon: Icon, tint, title, children }: { icon: any; tint: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4">
      <h3 className="mb-2 flex items-center gap-2 font-serif text-sm font-semibold text-[#e7eaee]"><Icon className={`size-4 ${tint}`} /> {title}</h3>
      <div className="space-y-1.5 text-sm leading-relaxed text-[#c5ccd4]">{children}</div>
    </section>
  )
}

function InfoModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="no-scrollbar flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116] shadow-xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[#29313b] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">{t('info.eyebrow')}</p>
            <h2 className="font-serif text-lg font-bold text-[#e7eaee]">{t('info.title')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('info.close')} className="rounded p-1.5 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-5" /></button>
        </header>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <InfoSection icon={Moon} tint="text-[#e0a028]" title={t('info.s1.title')}>
            <p>{t('info.s1.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s1.p2')}</p>
          </InfoSection>

          <InfoSection icon={Globe2} tint="text-[#6aa86f]" title={t('info.s2.title')}>
            <p>{t('info.s2.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s2.p2')}</p>
          </InfoSection>

          <InfoSection icon={Layers} tint="text-[#c0564a]" title={t('info.s3.title')}>
            <p>{t('info.s3.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s3.p2')}</p>
          </InfoSection>

          <InfoSection icon={Zap} tint="text-[#e0a028]" title={t('info.s4.title')}>
            <p>{t('info.s4.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s4.p2')}</p>
          </InfoSection>

          <InfoSection icon={Compass} tint="text-[#5b8db8]" title={t('info.s5.title')}>
            <p>{t('info.s5.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s5.p2')}</p>
          </InfoSection>

          <InfoSection icon={Clock} tint="text-[#d08a3a]" title={t('info.s6.title')}>
            <p>{t('info.s6.p1')}</p>
          </InfoSection>

          <InfoSection icon={AlertTriangle} tint="text-[#e5484d]" title={t('info.s7.title')}>
            <p>{t('info.s7.p1')}</p>
            <p className="text-[#8b94a0]">{t('info.s7.p2')}</p>
          </InfoSection>
        </div>
      </div>
    </div>
  )
}
