'use client'
import { useMemo } from 'react'
import { CartesianGrid, ComposedChart, Line, Area, ReferenceLine, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import type { MagneticAnomaly, PlateCrossing, Earthquake } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

type Props = { data: MagneticAnomaly[]; crossings: PlateCrossing[]; earthquakes: Earthquake[]; crossingsOnly: boolean; date: Date }

function Legend() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#8b94a0]">
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#e0a028]" /> {t('chart.legend.energy')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 rounded bg-[#5b8db8]" /> {t('chart.legend.rate')}</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t-2 border-dashed border-[#d08a3a]" /> {t('chart.legend.level5')}</span>
      <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#6aa86f]" /><i className="size-2.5 rounded-full bg-[#d08a3a]" /><i className="size-2.5 rounded-full bg-[#c0564a]" /> {t('chart.legend.quake')}</span>
    </div>
  )
}

export function CordaroChart({ data, crossings, earthquakes, crossingsOnly, date }: Props) {
  const { t } = useI18n()
  const visible = useMemo(() => crossingsOnly ? data.filter((row) => crossings.some((crossing) => Math.abs(row.timestamp - crossing.timestamp) < 3600000)) : data, [data, crossings, crossingsOnly])
  const earthquakePoints = earthquakes.map((quake) => ({ time: quake.time, value: Math.min(9.6, quake.magnitude / 1.1), magnitude: quake.magnitude, place: quake.place }))

  const isToday = date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
  const nowLabel = useMemo(() => {
    const n = new Date()
    const mins = n.getUTCHours() * 60 + n.getUTCMinutes()
    const r = Math.round(mins / 15) * 15
    return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`
  }, [])

  return (
    <section className="flex h-[56vh] min-h-[500px] shrink-0 flex-col overflow-hidden rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-base font-bold text-[#e7eaee]">{t('chart.title')}</h1>
          <p className="text-xs text-[#8b94a0]">{t('chart.subtitle')} · <span className="font-mono text-[#e0a028]">{date.toISOString().slice(0, 10)}</span></p>
        </div>
        <Legend />
      </header>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visible} margin={{ top: 12, right: 20, bottom: 28, left: 60 }} barGap={0} barCategoryGap={0}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0a028" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e0a028" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8b94a0' }} interval={7} tickLine={{ stroke: '#29313b' }} axisLine={{ stroke: '#29313b' }} label={{ value: t('chart.axisX'), position: 'insideBottomRight', offset: -14, fontSize: 10, fill: '#8b94a0' }} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 5, 6, 8, 10]} tick={{ fontSize: 10, fill: '#8b94a0' }} label={{ value: t('chart.axisY'), angle: -90, position: 'insideLeft', offset: -40, fontSize: 10, fill: '#e0a028' }} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded border border-[#29313b] bg-[#151a21] p-2 text-[11px] shadow-sm">
                  <p className="mb-1 font-mono font-bold text-[#e7eaee]">UTC {label}</p>
                  {payload.filter((p) => p.dataKey === 'energy' || p.dataKey === 'globalRate').map((p) => (
                    <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey === 'energy' ? t('chart.legend.energy') : t('chart.legend.rate')}: {Number(p.value).toFixed(2)}</p>
                  ))}
                </div>
              )
            }} />
            <ReferenceLine y={5} stroke="#d08a3a" strokeWidth={1} strokeDasharray="6 4" label={{ value: t('chart.legend.level5'), position: 'right', fill: '#d08a3a', fontSize: 10 }} />
            {isToday && <ReferenceLine x={nowLabel} stroke="#e7eaee" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: t('countdown.now'), position: 'top', fill: '#e7eaee', fontSize: 10 }} />}
            {crossings.map((crossing) => <ReferenceLine key={crossing.id} x={crossing.time} stroke={crossing.color} strokeWidth={crossing.type === 'moon' ? 1.5 : 1} strokeDasharray={crossing.type === 'moon' ? undefined : '4 3'} label={{ value: `${crossing.time}`, position: 'top', angle: -90, fill: crossing.color, fontSize: 9 }} />)}
            <Area type="monotone" dataKey="energy" stroke="#e0a028" strokeWidth={2.5} fill="url(#energyGradient)" isAnimationActive={false} />
            <Line type="monotone" dataKey="globalRate" stroke="#5b8db8" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line data={earthquakePoints} dataKey="value" stroke="#8b94a0" strokeWidth={1.5} dot={false} isAnimationActive={false} opacity={0.6} />
            <Scatter data={earthquakePoints} dataKey="value" shape={(props: any) => { const mag = Number(props.payload?.magnitude) || 0; const c = mag >= 7 ? '#c0564a' : mag >= 5 ? '#d08a3a' : '#6aa86f'; return <g><circle cx={props.cx} cy={props.cy} r={5} fill={c} stroke="#151a21" strokeWidth={1} /><text x={Number(props.cx) + 7} y={Number(props.cy) - 7} fontSize="9" fill={c}>M {mag.toFixed(1)}</text></g> }} />
            <Brush dataKey="time" height={22} stroke="#8b94a0" fill="#1c232b" travellerWidth={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
