'use client'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Radio, RefreshCw } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { OBSERVATORIES } from '@/lib/observatories'
import { fftSpectrum, spectrogram, type Spectrogram } from '@/lib/fft'

type Status = 'loading' | 'ready' | 'error'
type ComponentKey = 'x' | 'y' | 'z' | 'f'
type MagnetPoint = { time: string; x: number | null; y: number | null; z: number | null; f: number | null }

const COMPONENTS: { key: ComponentKey; label: string; color: string }[] = [
  { key: 'x', label: 'X', color: '#5b8db8' },
  { key: 'y', label: 'Y', color: '#e0a028' },
  { key: 'z', label: 'Z', color: '#6aa86f' },
  { key: 'f', label: 'F', color: '#b07cd8' },
]

const MIN_POINTS = 16

function parseCsv(csv: string): { points: MagnetPoint[]; lastTime: string } {
  const points: MagnetPoint[] = []
  let lastTime = ''

  const read = (cols: string[], idx: number): number | null => {
    const v = parseFloat(cols[idx])
    return Number.isFinite(v) && v < 99999 ? v : null
  }

  for (const raw of csv.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const cols = line.split(',')
    if (cols.length < 5) continue
    // columnas fijas: Time, X, Y, Z, F
    const x = read(cols, 1)
    const y = read(cols, 2)
    const z = read(cols, 3)
    const f = read(cols, 4)
    if (x == null && y == null && z == null && f == null) continue
    points.push({ time: cols[0], x, y, z, f })
    lastTime = cols[0]
  }

  return { points, lastTime }
}

function heatColor(t: number): string {
  const stops = [
    { at: 0, rgb: [18, 24, 31] },
    { at: 0.45, rgb: [106, 168, 111] },
    { at: 1, rgb: [224, 160, 40] },
  ]
  const x = Math.max(0, Math.min(1, t))
  let rgb = stops[0].rgb
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (x >= a.at && x <= b.at) {
      const f = (x - a.at) / (b.at - a.at)
      rgb = [
        a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f,
        a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f,
        a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f,
      ]
      break
    }
  }
  return `rgb(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])})`
}

function SpectrogramHeatmap({ spec, baseTimestamp }: { spec: Spectrogram; baseTimestamp: number }) {
  const rows = spec.periods.length
  const cols = spec.times.length
  if (rows === 0 || cols === 0) return null

  const flat = spec.values.flat()
  const maxVal = flat.reduce((m, v) => Math.max(m, v), 0) || 1
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (rows - 1)))
  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (cols - 1)))

  return (
    <div className="flex gap-2">
      <div className="flex w-9 shrink-0 flex-col justify-between text-right font-mono text-[9px] leading-none text-[#8b94a0]">
        {yLabels.map((r) => <span key={r}>{spec.periods[r]}</span>)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="h-56 w-full overflow-hidden rounded border border-[#29313b] bg-[#0e1116]">
          <svg width="100%" height="100%" viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none">
            {spec.values.map((row, r) => row.map((v, c) => {
              const tNorm = v ? Math.log1p(v) / Math.log1p(maxVal) : 0
              return <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={heatColor(tNorm)} />
            }))}
          </svg>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-[#8b94a0]">
          {xLabels.map((c) => <span key={c}>{format(new Date(baseTimestamp + spec.times[c] * 60000), 'HH:mm')}</span>)}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'linear-gradient(to right, rgb(18,24,31), rgb(106,168,111), rgb(224,160,40))' }} />
      </div>
    </div>
  )
}

type ChartTooltipProps = { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; color?: string }>; label?: string | number }

function MagnetogramTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-[#29313b] bg-[#151a21] px-2.5 py-2 text-[11px] shadow-sm">
      <p className="mb-1 font-mono font-bold text-[#e7eaee]">{label} UTC</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} style={{ color: p.color }}>{String(p.dataKey).toUpperCase()}: {Number(p.value).toFixed(1)} nT</p>
      ))}
    </div>
  )
}

function SpectrumTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded border border-[#29313b] bg-[#151a21] px-2.5 py-2 text-[11px] shadow-sm">
      <p className="mb-1 font-mono font-bold text-[#e7eaee]">{label} min</p>
      <p style={{ color: p.color }}>Amplitude: {Number(p.value).toExponential(2)}</p>
    </div>
  )
}

export function IntermagnetPanel() {
  const { t } = useI18n()
  const [code, setCode] = useState(OBSERVATORIES[0].code)
  const [status, setStatus] = useState<Status>('loading')
  const [points, setPoints] = useState<MagnetPoint[]>([])
  const [fftComponent, setFftComponent] = useState<ComponentKey>('z')
  const [lastTime, setLastTime] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 3600000)
    const params = new URLSearchParams({ id: `${code}/best-avail/PT1M/xyzf`, start: start.toISOString(), end: end.toISOString() })
    fetch(`/api/intermagnet?${params.toString()}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.text() })
      .then((csv) => {
        if (!active) return
        const { points, lastTime } = parseCsv(csv)
        if (points.length < MIN_POINTS) { setStatus('error'); return }
        setPoints(points)
        setLastTime(lastTime)
        setStatus('ready')
      })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [code, refreshKey])

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((k) => k + 1), 15 * 60000)
    return () => window.clearInterval(timer)
  }, [])

  // Componentes con suficientes datos como para representarse.
  const available = useMemo(() => COMPONENTS.filter((c) => points.filter((p) => p[c.key] != null).length >= MIN_POINTS), [points])

  const activeKey: ComponentKey = available.some((c) => c.key === fftComponent) ? fftComponent : (available[0]?.key ?? 'z')
  const activeComponent = COMPONENTS.find((c) => c.key === activeKey) ?? COMPONENTS[2]

  const magnetogramData = useMemo(() => {
    const step = Math.max(1, Math.floor(points.length / 360))
    return points.filter((_, i) => i % step === 0).map((p) => ({ time: format(new Date(p.time), 'HH:mm'), x: p.x, y: p.y, z: p.z, f: p.f }))
  }, [points])

  const activeValues = useMemo(() => points.map((p) => p[activeKey]).filter((v): v is number => v != null), [points, activeKey])
  const spectrum = useMemo(() => fftSpectrum(activeValues, 1), [activeValues])
  const spec = useMemo(() => spectrogram(activeValues, 1, 240), [activeValues])
  const baseTimestamp = points.length > 0 ? new Date(points[0].time).getTime() : Date.now()
  const ageLabel = useMemo(() => {
    if (!lastTime) return ''
    const ms = Math.max(0, Date.now() - new Date(lastTime).getTime())
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return `${Math.floor(ms / 1000)}s`
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `${d}d ${h % 24}h`
    return `${h}h ${mins % 60}m`
  }, [lastTime])

  const spectrumData = useMemo(() => {
    const step = Math.max(1, Math.floor(spectrum.length / 300))
    return spectrum.filter((_, i) => i % step === 0).map((p) => ({ period: Math.round(p.period * 10) / 10, amplitude: p.amplitude }))
  }, [spectrum])

  const axisStyle = { fill: '#8b94a0', fontSize: 10 }

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Radio className="size-4 text-[#6aa86f]" /> {t('mag.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('mag.subtitle')}</p>
        </div>
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"><RefreshCw className="size-3.5" /> {t('mag.refresh')}</button>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {OBSERVATORIES.map((obs) => (
          <button key={obs.code} type="button" onClick={() => setCode(obs.code)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${code === obs.code ? 'border-[#6aa86f]/70 bg-[#6aa86f]/15 text-[#6aa86f]' : 'border-[#29313b] bg-[#1c232b] text-[#8b94a0] hover:text-[#e7eaee]'}`}>
            {obs.code} · {obs.name}
          </button>
        ))}
      </div>

      {status === 'loading' && <div className="flex h-64 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('mag.loading')}</div>}
      {status === 'error' && <div className="flex h-64 items-center justify-center font-mono text-xs text-[#c0564a]">{t('mag.error')}</div>}

      {status === 'ready' && (
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]"><Activity className="size-3.5" /> {t('mag.magnetogram')}</p>
              <div className="flex items-center gap-3">
                {available.map((c) => (
                  <span key={c.key} className="flex items-center gap-1 font-mono text-[10px] text-[#8b94a0]"><span className="size-2 rounded-full" style={{ background: c.color }} /> {c.label}</span>
                ))}
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={magnetogramData} margin={{ top: 5, right: 12, bottom: 20, left: 8 }}>
                  <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="time" minTickGap={40} tick={axisStyle} stroke="#29313b" label={{ value: t('mag.axisTime'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis tick={axisStyle} stroke="#29313b" width={56} label={{ value: t('mag.axisZ'), angle: -90, position: 'insideLeft', fill: '#8b94a0', fontSize: 10 }} />
                  <Tooltip content={(props: any) => <MagnetogramTooltip {...props} />} cursor={{ stroke: '#29313b', strokeWidth: 1 }} />
                  {available.map((c) => (
                    <Line key={c.key} dataKey={c.key} type="monotone" stroke={c.color} strokeWidth={1.2} dot={false} isAnimationActive={false} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#d08a3a]"><Activity className="size-3.5" /> {t('mag.spectrogram')}</p>
              <span className="font-mono text-[10px] text-[#8b94a0]">{activeComponent.label} · {t('mag.axisX')}</span>
            </div>
            <SpectrogramHeatmap spec={spec} baseTimestamp={baseTimestamp} />
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6aa86f]"><Activity className="size-3.5" /> {t('mag.spectrum')}</p>
              <div className="flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
                {available.map((c) => (
                  <button key={c.key} type="button" onClick={() => setFftComponent(c.key)} className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${activeKey === c.key ? 'text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`} style={activeKey === c.key ? { background: c.color } : undefined}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spectrumData} margin={{ top: 5, right: 12, bottom: 20, left: 8 }}>
                  <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="period" type="number" domain={['dataMin', 'dataMax']} tick={axisStyle} stroke="#29313b" label={{ value: t('mag.axisX'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis tick={axisStyle} stroke="#29313b" width={56} />
                  <Tooltip content={(props: any) => <SpectrumTooltip {...props} />} cursor={{ stroke: '#29313b', strokeWidth: 1 }} />
                  <Line dataKey="amplitude" type="monotone" stroke={activeComponent.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
          <span className="flex items-center gap-1.5"><Activity className="size-3.5 text-[#6aa86f]" /> {t('mag.last')} {lastTime} · {t('mag.updated')} {ageLabel}</span>
          <a href="https://intermagnet.org" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#e7eaee]">{t('mag.source')}</a>
        </div>
      )}
    </section>
  )
}
