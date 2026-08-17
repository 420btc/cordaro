'use client'
import { useEffect, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type ResultRow = { magnitude: number; quakes: number; validated: number | null; expected: number | null; relativeRate: number | null; p: number | null; insufficient?: boolean }
type Backtest = { period: { days: number }; windowHours: number; radiusKm: number; totalCrossings: number; results: ResultRow[] }

type Status = 'loading' | 'ready' | 'error'

export function CrossingsValidationPanel() {
  const { t } = useI18n()
  const [days, setDays] = useState(30)
  const [windowHours, setWindowHours] = useState(24)
  const [status, setStatus] = useState<Status>('loading')
  const [result, setResult] = useState<Backtest | null>(null)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 60000)
    const params = new URLSearchParams({ days: String(days), window: String(windowHours) })
    fetch(`/api/validate-crossings?${params.toString()}`, { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error() ; return res.json() })
      .then((data: Backtest) => { if (!active) return; setResult(data); setStatus('ready') })
      .catch(() => { if (active) setStatus('error') })
      .finally(() => window.clearTimeout(timer))
    return () => { active = false; window.clearTimeout(timer) }
  }, [runKey])

  const pTone = (p: number | null) => (p == null ? 'text-[#8b94a0]' : p < 0.05 ? 'text-[#6aa86f]' : p < 0.1 ? 'text-[#e0a028]' : 'text-[#8b94a0]')
  const pLabel = (p: number | null) => (p == null ? '—' : p < 0.05 ? t('cv.significant') : t('cv.notSignificant'))

  const selectClass = 'rounded border border-[#29313b] bg-[#1c232b] px-2 py-1 font-mono text-xs text-[#e7eaee]'

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Activity className="size-4 text-[#6aa86f]" /> {t('cv.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('cv.subtitle')}</p>
        </div>
        <button type="button" onClick={() => setRunKey((k) => k + 1)} className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"><RefreshCw className="size-3.5" /> {status === 'loading' ? t('cv.analyzing') : t('cv.run')}</button>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">
          {t('cv.days')}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectClass}>
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={180}>180</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">
          {t('cv.window')}
          <select value={windowHours} onChange={(e) => setWindowHours(Number(e.target.value))} className={selectClass}>
            <option value={6}>±6 h</option>
            <option value={12}>±12 h</option>
            <option value={24}>±24 h</option>
            <option value={48}>±48 h</option>
          </select>
        </label>
      </div>

      {status === 'loading' && <div className="flex h-32 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('cv.analyzing')}</div>}
      {status === 'error' && <div className="flex h-32 items-center justify-center font-mono text-xs text-[#c0564a]">{t('cv.error')}</div>}

      {status === 'ready' && result && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] text-[#8b94a0]">{t('cv.crossings')}: {result.totalCrossings} · {t('cv.daysLabel', { n: result.period.days })} · {t('cv.windowLabel', { n: result.windowHours })} · ≤ {result.radiusKm} km</p>

          <div className="overflow-hidden rounded-md border border-[#29313b]">
            <div className="grid grid-cols-5 gap-2 border-b border-[#29313b] bg-[#1c232b] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[#8b94a0]">
              <span>{t('cv.magnitude')}</span>
              <span>{t('cv.quakes')}</span>
              <span>{t('cv.validated')} / {t('cv.expected')}</span>
              <span>{t('cv.rate')}</span>
              <span>{t('cv.pValue')}</span>
            </div>
            {result.results.map((r) => (
              <div key={r.magnitude} className="grid grid-cols-5 gap-2 border-b border-[#29313b] px-3 py-2 font-mono text-xs last:border-b-0">
                <span className="text-[#e7eaee]">M ≥ {r.magnitude.toFixed(1)}</span>
                <span className="text-[#8b94a0]">{r.quakes}</span>
                <span className="text-[#e7eaee]">{r.validated != null ? r.validated : '—'} <span className="text-[#8b94a0]">/ {r.expected != null ? r.expected : '—'}</span></span>
                <span className={r.relativeRate != null && r.relativeRate > 1 ? 'text-[#6aa86f]' : 'text-[#e7eaee]'}>{r.relativeRate != null ? `${r.relativeRate}×` : '—'}</span>
                <span className={pTone(r.p)}>{r.p != null ? r.p : '—'} {r.p != null && <span className="ml-1 text-[9px]">({pLabel(r.p)})</span>}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-relaxed text-[#8b94a0]">{t('cv.method')}</p>
        </div>
      )}
    </section>
  )
}
