'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { History, Trash2, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { clearWatched, loadWatched, type WatchedCrossing } from '@/lib/watchStore'

const MiniMap = dynamic(() => import('@/components/MiniMap').then((m) => m.MiniMap), { ssr: false, loading: () => <div className="h-full w-full bg-[#0e1116]" /> })

export function PastCrossingsPopup() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<WatchedCrossing[]>([])

  useEffect(() => { if (open) setItems(loadWatched()) }, [open])

  const clear = () => { clearWatched(); setItems([]) }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[900] flex items-center gap-2 rounded-full border border-[#e0a028]/50 bg-[#151a21]/90 px-3 py-2 text-xs font-semibold text-[#e0a028] shadow-lg backdrop-blur transition-colors hover:bg-[#1c232b]"
      >
        <History className="size-4" /> {t('past.title')}
      </button>

      {open && (
        <div className="fixed bottom-16 right-4 z-[900] w-80 max-w-[90vw] rounded-md border border-[#29313b] bg-[#151a21] p-3 shadow-2xl">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-[#e7eaee]">{t('past.title')}</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clear} title={t('past.clear')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><Trash2 className="size-4" /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('info.close')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-4" /></button>
            </div>
          </header>

          {items.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#8b94a0]">{t('past.empty')}</p>
          ) : (
            <div className="no-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.id}-${item.savedAt}`} className="flex items-center gap-2 rounded-md border border-[#29313b] bg-[#0e1116] p-2">
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded">
                    <MiniMap latitude={item.latitude} longitude={item.longitude} color={item.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-[#e7eaee]">{item.time} <span className="font-normal text-[#8b94a0]">· {item.plateA}</span></p>
                    <p className={`text-[10px] ${item.result ? 'text-[#6aa86f]' : 'text-[#8b94a0]'}`}>
                      {item.result ? t('watch.quakeFound', { magnitude: item.result.magnitude.toFixed(1), dist: item.result.distanceKm }) : t('past.none')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
