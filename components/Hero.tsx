'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function Hero() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <section
      className="relative overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116] transition-[max-height] duration-500 ease-in-out"
      style={{ maxHeight: open ? 1200 : 56 }}
    >
      <img src="/cordaro.png" alt={t('brand')} className="block h-auto w-full" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur transition-colors hover:bg-black/70"
      >
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {open ? t('hero.collapse') : t('hero.expand')}
      </button>
    </section>
  )
}
