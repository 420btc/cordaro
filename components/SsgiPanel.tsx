'use client'
import { useEffect, useMemo, useState } from 'react'
import { Orbit } from 'lucide-react'
import { Area, Brush, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import { computeSsgi, type SsgiAspectType, type SsgiPeak } from '@/lib/ssgi'
import { fetchEarthquakesRange } from '@/lib/earthquakes'
import type { Earthquake } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

const STEP_MS = 30 * 60000

const BODY_COLOR: Record<string, string> = {
  Mercury: '#e5484d',
  Venus: '#b07cd8',
  Earth: '#5b8db8',
  Moon: '#6aa86f',
  Other: '#8b94a0',
}

const TYPE_DASH: Record<SsgiAspectType, string | undefined> = {
  conjunction: undefined, // sólida
  square: '6 4',          // discontinua
  semi: '2 3',            // punteada
}

const pad = (n: number) => String(n).padStart(2, '0')
const fmtTick = (ts: number) => { const d = new Date(ts); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}` }
const fmtFull = (ts: number) => { const d = new Date(ts); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` }

type Row = { timestamp: number; index: number; quakeMag: number | null; quakePlace: string | null }

function Legend() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#8b94a0]">
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#e0a028]" /> {t('ssgi.legend.sum')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#e5484d]" /> {t('ssgi.legend.mercury')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#b07cd8]" /> {t('ssgi.legend.venus')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#5b8db8]" /> {t('ssgi.legend.earth')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#6aa86f]" /> {t('ssgi.legend.moon')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-solid border-[#8b94a0]" /> {t('ssgi.legend.conjunction')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-dashed border-[#8b94a0]" /> {t('ssgi.legend.square')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-dotted border-[#8b94a0]" /> {t('ssgi.legend.semi')}</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#6aa86f]" /><i className="size-2.5 rounded-full bg-[#d08a3a]" /><i className="size-2.5 rounded-full bg-[#c0564a]" /> {t('ssgi.legend.quake')}</span>
    </div>
  )
}

export function SsgiPanel({ date }: { date: Date }) {
  const { t } = useI18n()
  const ssgi = useMemo(() => computeSsgi(date), [date])
  const [quakes, setQuakes] = useState<Earthquake[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    // Misma ventana que computeSsgi: 3 días antes y 3 después de la fecha.
    const start = new Date(date.getTime() - 3 * 86400000)
    const end = new Date(date.getTime() + 3 * 86400000)
    fetchEarthquakesRange(start, end)
      .then((q) => { if (active) setQuakes(q) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date])

  // Fusiona sismos en la misma rejilla temporal que el índice SSGI, para que
  // el tooltip lea una única serie y no se desordene al mover el ratón.
  const rows = useMemo<Row[]>(() => {
    const byBucket = new Map<number, { mag: number; place: string }>()
    for (const q of quakes) {
      const snapped = Math.round(q.timestamp / STEP_MS) * STEP_MS
      const prev = byBucket.get(snapped)
      if (!prev || q.magnitude > prev.mag) byBucket.set(snapped, { mag: q.magnitude, place: q.place })
    }
    return ssgi.points.map((p) => {
      const q = byBucket.get(p.timestamp)
      return { timestamp: p.timestamp, index: p.index, quakeMag: q?.mag ?? null, quakePlace: q?.place ?? null }
    })
  }, [ssgi.points, quakes])

  const ticks = useMemo(() => {
    if (ssgi.points.length < 2) return []
    const min = ssgi.points[0].timestamp
    const max = ssgi.points[ssgi.points.length - 1].timestamp
    const n = 8
    return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1))
  }, [ssgi.points])

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Orbit className="size-4 text-[#b07cd8]" /> {t('ssgi.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('ssgi.subtitle')}</p>
        </div>
        <Legend />
      </header>

      {loading && <div className="flex h-48 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('ssgi.loading')}</div>}

      {!loading && (
        <div className="h-[52vh] min-h-[440px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 16, right: 20, bottom: 28, left: 40 }}>
              <defs>
                <linearGradient id="ssgiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0a028" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#e0a028" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} ticks={ticks} tick={{ fontSize: 10, fill: '#8b94a0' }} tickLine={{ stroke: '#29313b' }} axisLine={{ stroke: '#29313b' }} tickFormatter={fmtTick} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 5, 6, 8, 10]} tick={{ fontSize: 10, fill: '#8b94a0' }} width={34} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0]?.payload as Row | undefined
                  if (!row) return null
                  return (
                    <div className="rounded border border-[#29313b] bg-[#151a21] p-2 text-[11px] shadow-sm">
                      <p className="mb-1 font-mono font-bold text-[#e7eaee]">UTC {fmtFull(row.timestamp)}</p>
                      <p className="text-[#e0a028]">{t('ssgi.legend.sum')}: {row.index.toFixed(2)}</p>
                      {row.quakeMag != null && <p className="text-[#e7eaee]">M {row.quakeMag.toFixed(1)} · {row.quakePlace}</p>}
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="index" stroke="#e0a028" strokeWidth={2} fill="url(#ssgiGradient)" isAnimationActive={false} />
              {ssgi.peaks.map((peak: SsgiPeak, i: number) => (
                <ReferenceLine
                  key={`${peak.timestamp}-${peak.body}-${peak.partner}-${i}`}
                  x={peak.timestamp}
                  stroke={BODY_COLOR[peak.body] ?? '#8b94a0'}
                  strokeWidth={peak.type === 'conjunction' ? 1.5 : 1}
                  strokeDasharray={TYPE_DASH[peak.type]}
                  strokeOpacity={0.9}
                  label={{ value: peak.body, position: 'top', angle: -90, fill: BODY_COLOR[peak.body] ?? '#8b94a0', fontSize: 9 }}
                />
              ))}
              <Scatter data={rows} dataKey="quakeMag" shape={(props: any) => { const mag = Number(props.payload?.quakeMag); if (!mag) return <g />; const c = mag >= 7 ? '#c0564a' : mag >= 5.5 ? '#d08a3a' : '#6aa86f'; return <g><circle cx={props.cx} cy={props.cy} r={4} fill={c} stroke="#151a21" strokeWidth={1} /><text x={Number(props.cx) + 6} y={Number(props.cy) - 6} fontSize="9" fill={c}>M {mag.toFixed(1)}</text></g> }} />
              <Brush dataKey="timestamp" height={22} stroke="#8b94a0" fill="#1c232b" travellerWidth={8} tickFormatter={fmtTick} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
        <span className="flex items-center gap-1.5"><Orbit className="size-3.5 text-[#b07cd8]" /> {t('ssgi.hint')}</span>
        <span>{t('ssgi.source')} · <a href="https://ssgeos.org/ssgi.htm" target="_blank" rel="noreferrer" className="text-[#e0a028] underline decoration-[#e0a028]/50 underline-offset-2 hover:text-[#e7eaee]">ssgeos.org</a></span>
      </footer>
    </section>
  )
}
