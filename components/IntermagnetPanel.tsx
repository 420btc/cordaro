'use client'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Radio, RefreshCw } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { OBSERVATORIES } from '@/lib/observatories'
import { fftSpectrum } from '@/lib/fft'

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

  const spectrum = useMemo(() => {
    const vals = points.map((p) => p[activeKey]).filter((v): v is number => v != null)
    return fftSpectrum(vals, 1)
  }, [points, activeKey])

  const spectrumData = useMemo(() => {
    const step = Math.max(1, Math.floor(spectrum.length / 300))
    return spectrum.filter((_, i) => i % step === 0).map((p) => ({ period: Math.round(p.period * 10) / 10, amplitude: p.amplitude }))
  }, [spectrum])

  const axisStyle = { fill: '#8b94a0', fontSize: 10 }
  const tooltipStyle = { background: '#151a21', border: '1px solid #29313b', fontSize: 12 }

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
                  <XAxis dataKey="time" minTickGap={40} tick={axisStyle} stroke="#29313b" label={{ value: t('mag.axisTime'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis tick={axisStyle} stroke="#29313b" width={56} label={{ value: t('mag.axisZ'), angle: -90, position: 'insideLeft', fill: '#8b94a0', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => `${value} UTC`} />
                  {available.map((c) => (
                    <Line key={c.key} dataKey={c.key} type="monotone" stroke={c.color} strokeWidth={1.2} dot={false} isAnimationActive={false} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                  <XAxis dataKey="period" type="number" domain={['dataMin', 'dataMax']} tick={axisStyle} stroke="#29313b" label={{ value: t('mag.axisX'), position: 'insideBottom', offset: -12, fill: '#8b94a0', fontSize: 10 }} />
                  <YAxis tick={axisStyle} stroke="#29313b" width={56} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => `${value} min`} />
                  <Line dataKey="amplitude" type="monotone" stroke={activeComponent.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[#8b94a0]"><Activity className="size-3.5 text-[#6aa86f]" /> {t('mag.last')} {lastTime} · {activeComponent.label}</p>}
    </section>
  )
}
