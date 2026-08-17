'use client'
import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw, Sun } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { fftSpectrum } from '@/lib/fft'
import { analyzePeaks, dynamicPressureOf, fetchSolarWind, fluxOf, PROTON_THRESHOLD, type SolarWindPoint } from '@/lib/solarWind'

type Status = 'loading' | 'ready' | 'error'
type Mode = 'rtsw' | 'soho'

const MIN_POINTS = 16
const DENSITY_COLOR = '#6aa86f'
const SPEED_COLOR = '#5b8db8'

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = arr.length / max
  const out: T[] = []
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)])
  return out
}

const axisStyle = { fill: '#8b94a0', fontSize: 10 }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-[#29313b] bg-[#151a21] px-2.5 py-2 text-[11px] shadow-sm">
      <p className="mb-1 font-mono font-bold text-[#e7eaee]">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} style={{ color: p.color }}>
          {String(p.dataKey) === 'density' ? 'ρ' : 'v'}: {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

export function SolarWindPanel() {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('rtsw')
  const [status, setStatus] = useState<Status>('loading')
  const [points, setPoints] = useState<SolarWindPoint[]>([])
  const [dateStr, setDateStr] = useState('2026-06-07')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    const run = async () => {
      try {
        let data
        if (mode === 'rtsw') {
          data = await fetchSolarWind('rtsw')
        } else {
          const start = `${dateStr}T00:00:00Z`
          const endDate = new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + 2 * 86400000)
          const end = `${endDate.toISOString().slice(0, 10)}T23:59:59Z`
          data = await fetchSolarWind('soho', start, end)
        }
        if (!active) return
        if (data.points.length < MIN_POINTS) { setStatus('error'); return }
        setPoints(data.points)
        setStatus('ready')
      } catch {
        if (active) setStatus('error')
      }
    }
    run()
    return () => { active = false }
  }, [mode, dateStr, refreshKey])

  useEffect(() => {
    if (mode !== 'rtsw') return
    const timer = window.setInterval(() => setRefreshKey((k) => k + 1), 10 * 60000)
    return () => window.clearInterval(timer)
  }, [mode])

  const sampleMinutes = mode === 'rtsw' ? 1 : 5

  const peak = useMemo(() => analyzePeaks(points), [points])
  const now = Date.now()

  const current = useMemo(() => {
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      if (p.density != null || p.speed != null) return p
    }
    return null
  }, [points])

  const chartData = useMemo(() => {
    const filtered = points.filter((p) => p.density != null || p.speed != null)
    return downsample(filtered, 400).map((p) => ({
      time: format(new Date(p.timestamp), mode === 'rtsw' ? 'EEE HH:mm' : 'MM-dd HH:mm'),
      density: p.density,
      speed: p.speed,
    }))
  }, [points, mode])

  const densityValues = useMemo(() => points.map((p) => p.density).filter((v): v is number => v != null), [points])
  const spectrum = useMemo(() => fftSpectrum(densityValues, sampleMinutes), [densityValues, sampleMinutes])
  const spectrumData = useMemo(() => {
    const step = Math.max(1, Math.floor(spectrum.length / 300))
    return spectrum.filter((_, i) => i % step === 0).map((p) => ({ period: Math.round(p.period * 10) / 10, amplitude: p.amplitude }))
  }, [spectrum])

  const peakBadge = useMemo(() => {
    if (peak.currentlyAbove) return { tone: 'text-[#e0a028]', label: t('sw.peakOngoing') }
    if (peak.lastDrop != null && now - peak.lastDrop < 24 * 3600000) return { tone: 'text-[#6aa86f]', label: t('sw.peakWindow') }
    return { tone: 'text-[#8b94a0]', label: t('sw.peakNone') }
  }, [peak, now, t])

  const lastTime = points.length > 0 ? points[points.length - 1].time : ''

  const kpis = useMemo(() => {
    const density = current?.density ?? null
    const speed = current?.speed ?? null
    const flux = current ? fluxOf(current) : null
    const dyn = current ? dynamicPressureOf(current) : null
    return [
      { label: t('sw.density'), value: density != null ? density.toFixed(2) : '—', unit: 'cm⁻³', hot: density != null && density >= PROTON_THRESHOLD },
      { label: t('sw.speed'), value: speed != null ? speed.toFixed(0) : '—', unit: 'km/s', hot: false },
      { label: t('sw.flux'), value: flux != null ? flux.toFixed(0) : '—', unit: 'cm⁻³·km/s', hot: false },
      { label: t('sw.dynPressure'), value: dyn != null ? dyn.toFixed(0) : '—', unit: 'cm⁻³·km²/s²', hot: false },
    ]
  }, [current, t])

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Sun className="size-4 text-[#e0a028]" /> {t('sw.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('sw.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
            {(['rtsw', 'soho'] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${mode === m ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>
                {m === 'rtsw' ? t('sw.realtime') : t('sw.historical')}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"><RefreshCw className="size-3.5" /> {t('sw.refresh')}</button>
        </div>
      </header>

      {mode === 'soho' && (
        <div className="mb-3 flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">{t('sw.date')}</label>
          <input type="date" value={dateStr} min="1996-01-20" max="2026-06-08" onChange={(e) => setDateStr(e.target.value)} className="rounded border border-[#29313b] bg-[#1c232b] px-2 py-1 font-mono text-xs text-[#e7eaee]" />
          <span className="font-mono text-[10px] text-[#8b94a0]">+ 2 días · SOHO CELIAS/PM</span>
        </div>
      )}

      {status === 'loading' && <div className="flex h-64 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('sw.loading')}</div>}
      {status === 'error' && <div className="flex h-64 items-center justify-center font-mono text-xs text-[#c0564a]">{t('sw.error')}</div>}

      {status === 'ready' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-md border border-[#29313b] bg-[#0e1116] p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b94a0]">{k.label}</p>
                <p className={`mt-2 font-serif text-xl font-bold leading-none ${k.hot ? 'text-[#e0a028]' : 'text-[#e7eaee]'}`}>{k.value}</p>
                <p className="mt-1 font-mono text-[9px] text-[#8b94a0]">{k.unit}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]"><Activity className="size-3.5" /> {t('sw.density')} · {t('sw.speed')}</p>
              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${peak.currentlyAbove ? 'border-[#e0a028]/60 bg-[#e0a028]/15' : peak.lastDrop != null && now - peak.lastDrop < 24 * 3600000 ? 'border-[#6aa86f]/60 bg-[#6aa86f]/15' : 'border-[#29313b] bg-[#1c232b]'} ${peakBadge.tone}`}>{peakBadge.label}</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#8b94a0]"><span className="size-2 rounded-full" style={{ background: DENSITY_COLOR }} /> ρ</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#8b94a0]"><span className="size-2 rounded-full" style={{ background: SPEED_COLOR }} /> v</span>
              </div>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 8 }}>
                  <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="time" minTickGap={40} tick={axisStyle} stroke="#29313b" label={{ value: t('sw.axisTime'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis yAxisId="d" tick={axisStyle} stroke="#29313b" width={48} label={{ value: t('sw.axisDensity'), angle: -90, position: 'insideLeft', fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis yAxisId="s" orientation="right" tick={axisStyle} stroke="#29313b" width={48} label={{ value: t('sw.axisSpeed'), angle: 90, position: 'insideRight', fill: '#8b94a0', fontSize: 10 }} />
                  <Tooltip content={(props: any) => <ChartTooltip {...props} />} cursor={{ stroke: '#29313b', strokeWidth: 1 }} />
                  <ReferenceLine yAxisId="d" y={PROTON_THRESHOLD} stroke="#e0a028" strokeDasharray="4 4" label={{ value: t('sw.threshold'), position: 'insideTopRight', fill: '#e0a028', fontSize: 10 }} />
                  <Line yAxisId="d" dataKey="density" type="monotone" stroke={DENSITY_COLOR} strokeWidth={1.4} dot={false} isAnimationActive={false} connectNulls={false} />
                  <Line yAxisId="s" dataKey="speed" type="monotone" stroke={SPEED_COLOR} strokeWidth={1.2} dot={false} isAnimationActive={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6aa86f]"><Activity className="size-3.5" /> {t('sw.spectrum')}</p>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spectrumData} margin={{ top: 5, right: 12, bottom: 20, left: 8 }}>
                  <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="period" type="number" domain={['dataMin', 'dataMax']} tick={axisStyle} stroke="#29313b" label={{ value: t('mag.axisX'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis tick={axisStyle} stroke="#29313b" width={56} />
                  <Tooltip content={(props: any) => <SpectrumTooltip {...props} />} cursor={{ stroke: '#29313b', strokeWidth: 1 }} />
                  <Line dataKey="amplitude" type="monotone" stroke={DENSITY_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
          <span className="flex items-center gap-1.5"><Activity className="size-3.5 text-[#e0a028]" /> {t('sw.last')} {lastTime}</span>
          <span>{t('sw.source')}</span>
        </div>
      )}
    </section>
  )
}

function SpectrumTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number | string; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-[#29313b] bg-[#151a21] px-2.5 py-2 text-[11px] shadow-sm">
      <p className="mb-1 font-mono font-bold text-[#e7eaee]">{label} min</p>
      <p style={{ color: DENSITY_COLOR }}>Amplitude: {Number(payload[0].value).toExponential(2)}</p>
    </div>
  )
}
