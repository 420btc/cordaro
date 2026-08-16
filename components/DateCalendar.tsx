'use client'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { useI18n } from '@/lib/i18n'

type Props = {
  selected: Date
  coincidences: Record<string, number>
  loading: boolean
  onSelect: (date: Date) => void
}

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function DateCalendar({ selected, coincidences, loading, onSelect }: Props) {
  const { lang } = useI18n()
  const [month, setMonth] = useState(() => startOfMonth(selected))
  const locale = lang === 'es' ? 'es-ES' : 'en-US'

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)
  const weekDays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
    const monday = new Date(Date.UTC(2021, 0, 4)) // lunes de referencia
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(monday.getTime() + i * 86400000)))
  }, [locale])

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }), [month])

  return (
    <div className="w-64 rounded-md border border-[#29313b] bg-[#151a21] p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(subMonths(month, 1))} aria-label="Mes anterior" className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><ChevronLeft className="size-4" /></button>
        <span className="flex items-center gap-1.5 font-serif text-sm font-bold capitalize text-[#e7eaee]">
          {monthLabel}
          {loading && <LoaderCircle className="size-3.5 animate-spin text-[#e0a028]" />}
        </span>
        <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Mes siguiente" className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><ChevronRight className="size-4" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d, i) => <span key={i} className="font-mono text-[9px] uppercase text-[#8b94a0]">{d}</span>)}

        {days.map((day) => {
          const key = dateKey(day)
          const count = coincidences[key] ?? 0
          const isSelected = isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, month)
          const isTodayDate = isToday(day)

          const base = 'relative flex h-8 items-center justify-center rounded font-mono text-xs transition-colors'
          const state = isSelected
            ? 'bg-[#e0a028] text-[#0e1116] font-bold'
            : count > 0
              ? 'bg-[#6aa86f]/25 text-[#6aa86f] font-bold hover:bg-[#6aa86f]/40'
              : isCurrentMonth
                ? 'text-[#e7eaee] hover:bg-[#29313b]'
                : 'text-[#3a434e] hover:bg-[#29313b]'

          return (
            <button key={key} type="button" onClick={() => onSelect(day)} className={`${base} ${state} ${isTodayDate && !isSelected ? 'ring-1 ring-[#8b94a0]' : ''}`}>
              {day.getDate()}
              {count > 0 && <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px] font-bold leading-none text-[#6aa86f]">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
