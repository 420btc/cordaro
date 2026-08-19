'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Waves } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type Chart = 'shm' | 'sra' | 'srf' | 'srq'

const TABS: Array<{ id: Chart; key: 'sch.chart.shm' | 'sch.chart.sra' | 'sch.chart.srf' | 'sch.chart.srq' }> = [
  { id: 'shm', key: 'sch.chart.shm' },
  { id: 'sra', key: 'sch.chart.sra' },
  { id: 'srf', key: 'sch.chart.srf' },
  { id: 'srq', key: 'sch.chart.srq' },
]

export function SchumannPanel() {
  const { t } = useI18n()
  const [chart, setChart] = useState<Chart>('shm')
  const [version, setVersion] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setVersion((v) => v + 1), 5 * 60000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Waves className="size-4 text-[#6aa86f]" /> {t('sch.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('sch.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => { setVersion((v) => v + 1); setFailed(false) }}
          className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"
        >
          <RefreshCw className="size-3.5" /> {t('sch.refresh')}
        </button>
      </header>

      <div className="mb-3 flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setChart(tab.id); setFailed(false) }}
            className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${chart === tab.id ? 'bg-[#6aa86f] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116]">
        {failed ? (
          <div className="flex h-64 items-center justify-center px-4 text-center font-mono text-xs text-[#c0564a]">{t('sch.error')}</div>
        ) : (
          <img
            key={`${chart}-${version}`}
            src={`/api/schumann?chart=${chart}&v=${version}`}
            alt={t('sch.alt')}
            className="h-auto w-full"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
        <span className="flex items-center gap-1.5"><Waves className="size-3.5 text-[#6aa86f]" /> {t('sch.hint')}</span>
        <span>{t('sch.source')} · <a href="http://sosrff.tsu.ru/?page_id=7" target="_blank" rel="noreferrer" className="text-[#e0a028] underline decoration-[#e0a028]/50 underline-offset-2 hover:text-[#e7eaee]">{t('sch.sourceLink')}</a></span>
      </footer>
    </section>
  )
}
