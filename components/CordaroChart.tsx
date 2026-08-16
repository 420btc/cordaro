'use client'
import { useMemo } from 'react'
import { CartesianGrid, ComposedChart, Line, Area, ReferenceLine, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { MagneticAnomaly, PlateCrossing, Earthquake } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

type Props = { data: MagneticAnomaly[]; crossings: PlateCrossing[]; earthquakes: Earthquake[]; crossingsOnly: boolean; date: Date }

function Legend() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#fbbf24]" /> {t('chart.legend.energy')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#38bdf8]" /> {t('chart.legend.rate')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-dashed border-[#fb923c]" /> {t('chart.legend.level5')}</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#4ade80]" /><i className="size-2.5 rounded-full bg-[#fb923c]" /><i className="size-2.5 rounded-full bg-[#ef4444]" /> {t('chart.legend.quake')}</span>
    </div>
  )
}

export function CordaroChart({ data, crossings, earthquakes, crossingsOnly, date }: Props) {
  const { t } = useI18n()
  const visible = useMemo(() => crossingsOnly ? data.filter((row) => crossings.some((crossing) => Math.abs(row.timestamp - crossing.timestamp) < 3600000)) : data, [data, crossings, crossingsOnly])
  const earthquakePoints = earthquakes.map((quake) => ({ time: quake.time, value: Math.min(9.6, quake.magnitude / 1.1), magnitude: quake.magnitude, place: quake.place }))

  return (
    <section className="flex h-[56vh] min-h-[500px] shrink-0 flex-col overflow-hidden rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 backdrop-blur-xl">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-white">{t('chart.title')}</h1>
          <p className="text-xs text-slate-400">{t('chart.subtitle')} · <span className="font-mono text-cyan-300">{date.toISOString().slice(0, 10)}</span></p>
        </div>
        <Legend />
      </header>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visible} margin={{ top: 12, right: 20, bottom: 28, left: 60 }} barGap={0} barCategoryGap={0}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={7} tickLine={{ stroke: '#475569' }} axisLine={{ stroke: '#475569' }} label={{ value: t('chart.axisX'), position: 'insideBottomRight', offset: -14, fontSize: 10, fill: '#94a3b8' }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 5, 6, 8, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: t('chart.axisY'), angle: -90, position: 'insideLeft', offset: -40, fontSize: 10, fill: '#f87171' }} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg border border-white/10 bg-slate-950/95 p-2 text-[11px] shadow-xl">
                  <p className="mb-1 font-mono font-bold text-white">UTC {label}</p>
                  {payload.filter((p) => p.dataKey === 'energy' || p.dataKey === 'globalRate').map((p) => (
                    <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey === 'energy' ? t('chart.legend.energy') : t('chart.legend.rate')}: {Number(p.value).toFixed(2)}</p>
                  ))}
                </div>
              )
            }} />
            <ReferenceLine y={5} stroke="#fb923c" strokeWidth={1} strokeDasharray="6 4" label={{ value: t('chart.legend.level5'), position: 'right', fill: '#fdba74', fontSize: 10 }} />
            {crossings.map((crossing) => <ReferenceLine key={crossing.id} x={crossing.time} stroke={crossing.color} strokeWidth={crossing.type === 'moon' ? 1.5 : 1} strokeDasharray={crossing.type === 'moon' ? undefined : '4 3'} label={{ value: `${crossing.time}`, position: 'top', angle: -90, fill: crossing.color, fontSize: 9 }} />)}
            <Area type="monotone" dataKey="energy" stroke="#fbbf24" strokeWidth={2.5} fill="url(#energyGradient)" isAnimationActive={false} />
            <Line type="monotone" dataKey="globalRate" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Scatter data={earthquakePoints} dataKey="value" shape={(props: any) => { const mag = Number(props.payload?.magnitude) || 0; const c = mag >= 7 ? '#ef4444' : mag >= 5 ? '#fb923c' : '#4ade80'; return <g><circle cx={props.cx} cy={props.cy} r={5} fill={c} stroke="#0b1220" strokeWidth={1} /><text x={Number(props.cx) + 7} y={Number(props.cy) - 7} fontSize="9" fill={c}>M {mag.toFixed(1)}</text></g> }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
