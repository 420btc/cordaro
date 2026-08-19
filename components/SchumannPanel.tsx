'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Waves } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n, type TFunction } from '@/lib/i18n'

type Chart = 'shm' | 'sra' | 'srf' | 'srq'

const TABS: Array<{ id: Chart; key: 'sch.chart.shm' | 'sch.chart.sra' | 'sch.chart.srf' | 'sch.chart.srq' }> = [
  { id: 'shm', key: 'sch.chart.shm' },
  { id: 'sra', key: 'sch.chart.sra' },
  { id: 'srf', key: 'sch.chart.srf' },
  { id: 'srq', key: 'sch.chart.srq' },
]

function relativeLabel(ms: number, t: TFunction): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return t('sch.rel.sec', { n: s })
  const m = Math.floor(s / 60)
  if (m < 60) return t('sch.rel.min', { n: m })
  const h = Math.floor(m / 60)
  return t('sch.rel.hour', { n: h })
}

export function SchumannPanel() {
  const { t } = useI18n()
  const [chart, setChart] = useState<Chart>('shm')
  const [version, setVersion] = useState(0)
  const [src, setSrc] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setVersion((v) => v + 1), 5 * 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setLoading(true)
    setFailed(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/schumann?chart=${chart}&v=${version}`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const blob = await res.blob()
        const header = res.headers.get('x-fetched-at')
        const at = header ? new Date(header).getTime() : Date.now()
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
        setFetchedAt(Number.isFinite(at) ? at : Date.now())
        setLoading(false)
      } catch {
        if (active) { setFailed(true); setLoading(false) }
      }
    })()
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [chart, version])

  const updatedText = fetchedAt != null ? format(new Date(fetchedAt), "dd/MM/yyyy HH:mm:ss 'UTC'") : '—'
  const updatedAgo = fetchedAt != null ? relativeLabel(now - fetchedAt, t) : ''

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><Waves className="size-4 text-[#6aa86f]" /> {t('sch.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('sch.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {fetchedAt != null && !failed && (
            <span className="rounded-full border border-[#6aa86f]/40 bg-[#6aa86f]/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#6aa86f]">
              {t('sch.updated')} · {updatedAgo}
            </span>
          )}
          <button
            type="button"
            onClick={() => { setVersion((v) => v + 1); setFailed(false) }}
            className="flex h-8 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"
          >
            <RefreshCw className="size-3.5" /> {t('sch.refresh')}
          </button>
        </div>
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
        {loading && <div className="flex h-64 items-center justify-center font-mono text-xs text-[#8b94a0]">{t('sch.loading')}</div>}
        {failed && <div className="flex h-64 items-center justify-center px-4 text-center font-mono text-xs text-[#c0564a]">{t('sch.error')}</div>}
        {!loading && !failed && src && <img src={src} alt={t('sch.alt')} className="h-auto w-full" />}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#29313b] pt-2 font-mono text-[10px] text-[#8b94a0]">
        <span className="flex items-center gap-1.5"><Waves className="size-3.5 text-[#6aa86f]" /> {t('sch.hint')}</span>
        <span className="flex flex-wrap items-center gap-2">
          {fetchedAt != null && !failed && <span className="text-[#8b94a0]">{t('sch.updated')}: {updatedText}</span>}
          <span>{t('sch.source')} · <a href="https://sos70.ru/" target="_blank" rel="noreferrer" className="text-[#e0a028] underline decoration-[#e0a028]/50 underline-offset-2 hover:text-[#e7eaee]">{t('sch.sourceLink')}</a></span>
        </span>
      </footer>
    </section>
  )
}
