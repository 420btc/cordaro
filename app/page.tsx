'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { toPng } from 'html-to-image'
import { AlertTriangle, Clock, Compass, Globe2, Layers, Moon, Ruler, Sun, X, Zap } from 'lucide-react'
import { CordaroChart } from '@/components/CordaroChart'
import { CordaroMap } from '@/components/CordaroMap'
import { DateControls } from '@/components/DateControls'
import { dateKey, type DayData, type MoonPosition, type PlateCrossing } from '@/lib/types'
import { generateDayData } from '@/lib/dailyData'
import { moonIllumination, moonPhaseName } from '@/lib/astronomy'

const MiniMap = dynamic(() => import('@/components/MiniMap').then((m) => m.MiniMap), { ssr: false, loading: () => <div className="h-full w-full bg-[#0b1220]" /> })

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d >= 2) return `${d} d ${h} h`
  const totalH = Math.floor(totalSec / 3600)
  if (totalH > 0) return `${totalH} h ${m} min ${s} s`
  if (m > 0) return `${m} min ${s} s`
  return `${s} s`
}

function formatCountdown(timestamp: number, now: number): { label: string; tone: 'now' | 'soon' | 'past' } {
  const diff = timestamp - now
  const abs = Math.abs(diff)
  if (abs < 30000) return { label: 'Ahora', tone: 'now' }
  const prefix = diff > 0 ? 'en' : 'hace'
  return { label: `${prefix} ${formatDuration(abs)}`, tone: diff > 0 ? 'soon' : 'past' }
}

function formatCoord(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'Norte' : 'Sur'
  const lonDir = longitude >= 0 ? 'Este' : 'Oeste'
  return `Lat ${Math.abs(latitude).toFixed(0)}° ${latDir} · Lon ${Math.abs(longitude).toFixed(0)}° ${lonDir}`
}

export default function Page() {
  const [date, setDate] = useState(() => { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) })
  const [live, setLive] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [crossingsOnly, setCrossingsOnly] = useState(false)
  const [showAntipode, setShowAntipode] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => generateDayData(date), [date])

  useEffect(() => { if (!live) return; const timer = window.setInterval(() => setDate(new Date(dateKey(new Date()) + 'T00:00:00Z')), 300000); return () => window.clearInterval(timer) }, [live])

  const summary = useMemo(() => {
    const mid = data.positions[Math.floor(data.positions.length / 2)] ?? data.positions[0]
    const peak = data.anomalies.reduce((acc, row) => (row.globalRate > acc.value ? { value: row.globalRate, time: row.time } : acc), { value: 0, time: '' })
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
        <CrossingsTimeline crossings={data.crossings} />

        <div ref={captureRef} style={{ backgroundColor: '#060a18', backgroundImage: 'radial-gradient(1100px 520px at 12% 0%, rgba(99,102,241,0.16), transparent 60%), radial-gradient(900px 480px at 88% 18%, rgba(34,211,238,0.10), transparent 55%)' }} className="flex flex-col gap-4">
          <CordaroChart data={data.anomalies} crossings={data.crossings} earthquakes={data.earthquakes} crossingsOnly={crossingsOnly} date={date} />
          <CordaroMap positions={data.positions} sunPositions={data.sunPositions} crossings={data.crossings} showAntipode={showAntipode} animate={animate} />
          <footer className="flex items-start gap-2 px-1 pb-1 text-[11px] leading-relaxed text-slate-500">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
            <span>Posiciones lunares y solares calculadas con astronomy-engine; las anomalías son una simulación visual del método Cordaro y los sismos son datos de ejemplo.</span>
          </footer>
        </div>
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </main>
  )
}

function SummaryStrip({ data, summary }: { data: DayData; summary: { mid: MoonPosition; peak: { value: number; time: string }; maxMag: number } }) {
  const illumination = moonIllumination(summary.mid.phase)
  const items = [
    { label: 'Fase lunar', value: `${Math.round(illumination * 100)}%`, sub: moonPhaseName(summary.mid.phase), Icon: Moon, tint: 'text-amber-300' },
    { label: 'Ángulo Luna–Sol', value: `${summary.mid.sunAngle.toFixed(0)}°`, sub: 'separación angular', Icon: Sun, tint: 'text-orange-300' },
    { label: 'Distancia lunar', value: `${Math.round(summary.mid.distanceKm).toLocaleString('es-ES')} km`, sub: 'centro a centro', Icon: Ruler, tint: 'text-cyan-300' },
    { label: 'Cruces de placas', value: `${data.crossings.length}`, sub: 'en 24 horas', Icon: Layers, tint: 'text-rose-300' },
    { label: 'Pico de energía', value: summary.peak.value.toFixed(1), sub: `de 10 · ${summary.peak.time} UTC`, Icon: Zap, tint: 'text-violet-300' },
    { label: 'Sismos (≥ M3)', value: `${data.earthquakes.length}`, sub: `máx M ${summary.maxMag.toFixed(1)}`, Icon: Globe2, tint: 'text-emerald-300' },
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

function CrossingsTimeline({ crossings }: { crossings: PlateCrossing[] }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])

  const sorted = useMemo(() => [...crossings].sort((a, b) => a.timestamp - b.timestamp), [crossings])
  const nextId = sorted.find((crossing) => crossing.timestamp > now)?.id

  return (
    <section aria-label="Cruces de placas de hoy" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white"><Clock className="size-4 text-cyan-300" /> Cruces de placas de hoy</h2>
          <p className="text-xs text-slate-400">Dónde y cuándo la Luna (o su antípoda) cruza una frontera tectónica</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{crossings.length} cruces</span>
      </header>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">Sin cruces detectados este día.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {sorted.map((crossing) => <CrossingCard key={crossing.id} crossing={crossing} now={now} isNext={crossing.id === nextId} />)}
        </div>
      )}
    </section>
  )
}

function CrossingCard({ crossing, now, isNext }: { crossing: PlateCrossing; now: number; isNext: boolean }) {
  const isMoon = crossing.type === 'moon'
  const color = isMoon ? '#f43f5e' : '#3b82f6'
  const { label, tone } = formatCountdown(crossing.timestamp, now)
  const toneClass = tone === 'now' ? 'bg-amber-500/20 text-amber-200' : tone === 'soon' ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/10 text-slate-400'
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/[0.02] ${isNext ? 'border-cyan-400/60 ring-1 ring-cyan-400/40' : 'border-white/10'}`}>
      <div className="h-32 w-full overflow-hidden">
        <MiniMap latitude={crossing.latitude} longitude={crossing.longitude} color={color} />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold text-white">{crossing.time}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>{label}</span>
        </div>
        {isNext && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Próximo cruce</p>}
        <p className="mt-1 text-sm font-semibold text-slate-100">{isMoon ? 'La Luna cruza' : 'La antípoda cruza'}</p>
        <p className="text-xs text-slate-300">{crossing.plateA}</p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">{formatCoord(crossing.latitude, crossing.longitude)}</p>
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
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="no-scrollbar flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Guía rápida</p>
            <h2 className="text-lg font-semibold text-white">¿Qué estoy viendo?</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </header>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <InfoSection icon={Moon} tint="text-amber-300" title="La Luna y el Sol">
            <p>La Luna tarda unos 28 días en dar una vuelta a la Tierra. Según se alinea con el Sol, vemos sus fases: nueva, creciente, llena y menguante.</p>
            <p className="text-slate-400">Cuando Luna, Tierra y Sol se alinean (luna nueva o llena), su atracción conjunta tira con más fuerza de la corteza terrestre.</p>
          </InfoSection>

          <InfoSection icon={Globe2} tint="text-emerald-300" title="Las placas tectónicas">
            <p>La superficie de la Tierra está partida en grandes piezas que se mueven muy despacio: las placas tectónicas.</p>
            <p className="text-slate-400">Donde dos placas se tocan hay una frontera (en rojo en el mapa). Ahí es donde ocurren la mayoría de los terremotos.</p>
          </InfoSection>

          <InfoSection icon={Layers} tint="text-rose-300" title="¿Qué es un cruce?">
            <p>Un cruce es el momento exacto en que la Luna (o su punto opuesto, la antípoda) pasa justo por encima de una frontera de placas.</p>
            <p className="text-slate-400">Técnico: el método Cordaro relaciona esa posición lunar con las anomalías magnéticas y abre una ventana de riesgo de unas horas.</p>
          </InfoSection>

          <InfoSection icon={Zap} tint="text-violet-300" title="La energía entrante y el gráfico">
            <p>El gráfico muestra la energía entrante estimada durante el día. Cuanto más alta, mayor probabilidad relativa de sismos en esa franja.</p>
            <p className="text-slate-400">Las barras de colores son niveles de anomalía magnética (rojo = mayor intensidad). La línea azul es la tasa global y la línea naranja marca el nivel 5 de alerta.</p>
          </InfoSection>

          <InfoSection icon={Compass} tint="text-cyan-300" title="Cómo leer el mapa">
            <p><span className="text-amber-300">●</span> Luna · <span className="text-orange-400">●</span> Sol · <span className="text-blue-400">●</span> Antípoda · <span className="text-rose-400">—</span> frontera de placas.</p>
            <p className="text-slate-400">Las líneas discontinuas son las trayectorias de la Luna y el Sol a lo largo del día. Los puntos blancos con la hora son los cruces.</p>
          </InfoSection>

          <InfoSection icon={Clock} tint="text-amber-200" title="La cuenta atrás">
            <p>Cada tarjeta de cruce indica cuánto falta (en horas, minutos y segundos) o cuánto hace que ocurrió. El próximo cruce se resalta en azul.</p>
          </InfoSection>

          <InfoSection icon={AlertTriangle} tint="text-amber-400" title="Datos y límites">
            <p>Las posiciones de la Luna y el Sol son reales (calculadas con astronomy-engine).</p>
            <p className="text-slate-400">Las anomalías magnéticas son una simulación visual del método y los sismos son datos de ejemplo. No es una predicción sísmica oficial.</p>
          </InfoSection>
        </div>
      </div>
    </div>
  )
}
