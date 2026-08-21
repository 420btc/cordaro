'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Zap } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { fetchSolarFlare, flareClassOf, type SolarFlareData } from '@/lib/solarFlare'
import { useI18n } from '@/lib/i18n'

const axisStyle = { fill: '#8b94a0', fontSize: 10 }

export function SolarFlarePanel() {
  const { t } = useI18n()
  const [data, setData] = useState<SolarFlareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const load = () => {
      fetchSolarFlare()
        .then((d) => { if (active) { setData(d); setLoading(false); setError(false) } })
        .catch(() => { if (active) { setError(true); setLoading(false) } })
    }
    load()
    const timer = window.setInterval(load, 5 * 60000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const chartData = (data?.series ?? []).map((p) => ({ time: format(new Date(p.timestamp), 'HH:mm'), flux: p.flux }))
  const latest = data?.latest ?? null
  const className = latest ? flareClassOf(latest.flux) : '—'

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Zap className="size-4 text-[#e0a028]" /> {t('fl.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('fl.subtitle')}</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); setError(false); fetchSolarFlare().then((d) => { setData(d); setLoading(false); setError(false) }).catch(() => { setError(true); setLoading(false) }) }} className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]">
          <RefreshCw className="size-3.5" /> {t('fl.refresh')}
        </button>
      </header>

      {loading && <div className="flex h-40 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('fl.loading')}</div>}
      {error && <div className="flex h-40 items-center justify-center font-mono text-xs text-[#c0564a]">{t('fl.error')}</div>}

      {!loading && !error && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-[#e0a028]/50 bg-[#e0a028]/10 px-3 py-1.5 font-serif text-2xl font-bold leading-none text-[#e0a028]">{className}</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b94a0]">{t('fl.flux')}</p>
              <p className="font-mono text-xs text-[#e7eaee]">{latest ? `${latest.flux.toExponential(2)} W/m²` : '—'}</p>
              {latest && <p className="font-mono text-[10px] text-[#8b94a0]">{format(new Date(latest.timestamp), "dd/MM HH:mm 'UTC'")}</p>}
            </div>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 18, left: 8 }}>
                <CartesianGrid stroke="#29313b" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="time" minTickGap={40} tick={axisStyle} stroke="#29313b" label={{ value: t('fl.axisTime'), position: 'insideBottom', offset: -10, fill: '#8b94a0', fontSize: 10 }} />
                <YAxis scale="log" domain={['auto', 'auto']} tick={axisStyle} stroke="#29313b" width={60} label={{ value: t('fl.axisFlux'), angle: -90, position: 'insideLeft', fill: '#8b94a0', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#151a21', border: '1px solid #29313b', fontSize: 11 }} labelStyle={{ color: '#e7eaee' }} formatter={(value: number | string) => [`${Number(value).toExponential(2)} W/m²`, t('fl.flux')]} />
                <Line dataKey="flux" type="monotone" stroke="#e0a028" strokeWidth={1.4} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  )
}
