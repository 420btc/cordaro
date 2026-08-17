'use client'
import { useState } from 'react'
import { CalendarDays, Download, Info, Pause, Play, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n, type Lang } from '@/lib/i18n'
import { DateCalendar } from '@/components/DateCalendar'

type Props = {
  date: Date
  live: boolean
  animate: boolean
  crossingsOnly: boolean
  showAntipode: boolean
  onDate: (date: Date) => void
  onLive: (value: boolean) => void
  onAnimate: (value: boolean) => void
  onCrossingsOnly: (value: boolean) => void
  onAntipode: (value: boolean) => void
  onExport: () => void
  onInfo: () => void
  coincidences: Record<string, number>
  coincidencesLoading: boolean
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2">
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-[#e0a028]' : 'bg-[#3a434e]'}`}>
        <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span className={`whitespace-nowrap text-xs font-medium ${checked ? 'text-[#e7eaee]' : 'text-[#8b94a0]'}`}>{label}</span>
    </button>
  )
}

function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center rounded border border-[#29313b] bg-[#1c232b] p-0.5">
      {(['es', 'en'] as Lang[]).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${lang === l ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function DateControls(props: Props) {
  const { t } = useI18n()
  const [calendarOpen, setCalendarOpen] = useState(false)
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-[#29313b] bg-[#151a21] px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <img src="/iconocordaro.png" alt={t('brand')} className="size-9 rounded" />
        <div>
          <p className="font-serif text-sm font-bold leading-tight text-[#e7eaee]">{t('brand')}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded border border-[#29313b] bg-[#1c232b] px-3 py-1.5">
        <CalendarDays className="size-4 text-[#e0a028]" />
        <div className="relative">
          <button type="button" onClick={() => setCalendarOpen((value) => !value)} className="font-mono text-xs text-[#e7eaee] hover:text-[#e0a028]">{format(props.date, 'dd/MM/yyyy')}</button>
          {calendarOpen && (
            <>
              <div className="fixed inset-0 z-[900]" onClick={() => setCalendarOpen(false)} />
              <div className="absolute left-0 top-full z-[1000] mt-2">
                <DateCalendar selected={props.date} coincidences={props.coincidences} loading={props.coincidencesLoading} onSelect={(date) => { props.onDate(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))); setCalendarOpen(false) }} />
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={() => props.onDate(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())))} className="rounded border border-[#29313b] bg-[#151a21] px-2.5 py-1 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]">{t('today')}</button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Switch label={t('live')} checked={props.live} onChange={props.onLive} />
        <Switch label={t('onlyCrossings')} checked={props.crossingsOnly} onChange={props.onCrossingsOnly} />
        <Switch label={t('antipode')} checked={props.showAntipode} onChange={props.onAntipode} />
        <Switch label={props.animate ? t('pauseMoon') : t('animateMoon')} checked={props.animate} onChange={props.onAnimate} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle />
        <button type="button" onClick={props.onInfo} className="flex h-9 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"><Info className="size-4" /> {t('howItWorks')}</button>
        <button type="button" onClick={props.onExport} className="flex h-9 items-center gap-1.5 rounded bg-[#e0a028] px-4 text-xs font-semibold text-[#0e1116] hover:bg-[#c88a1f]"><Download className="size-4" /> {t('exportImage')}</button>
        <span className="font-mono text-[10px] text-[#8b94a0]">{props.live ? <RefreshCw className="inline size-4 animate-spin" /> : props.animate ? <Play className="inline size-4 text-[#6aa86f]" /> : <Pause className="inline size-4" />}</span>
      </div>
    </header>
  )
}
