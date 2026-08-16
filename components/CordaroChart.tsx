'use client'
import { useMemo } from 'react'
import { CartesianGrid, ComposedChart, Line, Bar, ReferenceLine, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { MagneticAnomaly, PlateCrossing, Earthquake } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

type Props = { data: MagneticAnomaly[]; crossings: PlateCrossing[]; earthquakes: Earthquake[]; crossingsOnly: boolean; date: Date }
const COLORS = { red: '#f43f5e', orange: '#fb923c', green: '#4ade80', purple: '#c084fc', blue: '#60a5fa' }

function Legend() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
      <span className="flex items-center gap-1">
        <i className="size-2.5 rounded-[2px] bg-[#f43f5e]" />
        <i className="size-2.5 rounded-[2px] bg-[#fb923c]" />
        <i className="size-2.5 rounded-[2px] bg-[#4ade80]" />
        <i className="size-2.5 rounded-[2px] bg-[#c084fc]" />
        <i className="size-2.5 rounded-[2px] bg-[#60a5fa]" />
        <span className="ml-1">{t('chart.legend.anomaly')}</span>
      </span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#38bdf8]" /> {t('chart.legend.rate')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-dashed border-[#fb923c]" /> {t('chart.legend.level5')}</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#fbbf24]" /> {t('chart.legend.quake')}</span>
    </div>
  )
}

export function CordaroChart({ data, crossings, earthquakes, crossingsOnly, date }: Props) {
  const { t } = useI18n()
  const visible = useMemo(() => crossingsOnly ? data.filter((row) => crossings.some((crossing) => Math.abs(row.timestamp - crossing.timestamp) < 3600000)) : data, [data, crossings, crossingsOnly])
  const earthquakePoints = earthquakes.map((quake) => ({ time: quake.time, value: Math.min(9.6, quake.magnitude / 1.1), magnitude: quake.magnitude, place: quake.place }))

  return (
    <section className="flex h-[56vh] min-h-[500px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
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
            <CartesianGrid stroke="#1e293b" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={7} tickLine={{ stroke: '#475569' }} axisLine={{ stroke: '#475569' }} label={{ value: t('chart.axisX'), position: 'insideBottomRight', offset: -14, fontSize: 10, fill: '#94a3b8' }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 5, 6, 8, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: t('chart.axisY'), angle: -90, position: 'insideLeft', offset: -40, fontSize: 10, fill: '#f87171' }} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
              <div className="rounded-lg border border-white/10 bg-slate-950/95 p-2 text-[11px] shadow-xl">
                <p className="mb-1 font-mono font-bold text-white">UTC {label}</p>
                {payload.map((item) => <p key={item.dataKey} style={{ color: item.color }}>{String(item.dataKey)}: {Number(item.value).toFixed(2)}</p>)}
              </div>
            ) : null} />
            <ReferenceLine y={5} stroke="#fb923c" strokeWidth={1} strokeDasharray="6 4" label={{ value: t('chart.legend.level5'), position: 'right', fill: '#fdba74', fontSize: 10 }} />
            {crossings.map((crossing) => <ReferenceLine key={crossing.id} x={crossing.time} stroke={crossing.color} strokeWidth={crossing.type === 'moon' ? 1.5 : 1} strokeDasharray={crossing.type === 'moon' ? undefined : '4 3'} label={{ value: `${crossing.time}`, position: 'top', angle: -90, fill: crossing.color, fontSize: 9 }} />)}
            <Bar dataKey="red" fill={COLORS.red} isAnimationActive={false} />
            <Bar dataKey="orange" fill={COLORS.orange} isAnimationActive={false} />
            <Bar dataKey="green" fill={COLORS.green} isAnimationActive={false} />
            <Bar dataKey="purple" fill={COLORS.purple} isAnimationActive={false} />
            <Bar dataKey="blue" fill={COLORS.blue} isAnimationActive={false} />
            <Line type="monotone" dataKey="globalRate" stroke="#38bdf8" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            <Scatter data={earthquakePoints} dataKey="value" fill="#fbbf24" shape={(props: any) => <g><circle cx={props.cx} cy={props.cy} r={4} fill="#fbbf24" /><text x={Number(props.cx) + 5} y={Number(props.cy) - 5} fontSize="9" fill="#fde68a">M {props.payload?.magnitude?.toFixed(1)}</text></g>} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
