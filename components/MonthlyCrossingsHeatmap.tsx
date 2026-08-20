'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarRange, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const HeatmapInner = dynamic(() => import('./MonthlyHeatmapInner').then((m) => m.MonthlyHeatmapInner), {
  ssr: false,
  loading: () => <div className="h-[440px] w-full animate-pulse bg-[#0e1116]" />,
})

export function MonthlyCrossingsHeatmap() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <div>
          <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><CalendarRange className="size-4 text-[#5b8db8]" /> {t('heat.title')}</h2>
          <p className="text-xs text-[#8b94a0]">{t('heat.subtitle')}</p>
        </div>
        {open ? <ChevronUp className="size-5 shrink-0 text-[#8b94a0]" /> : <ChevronDown className="size-5 shrink-0 text-[#8b94a0]" />}
      </button>
      {open && <HeatmapInner />}
    </section>
  )
}
