'use client'

import { useEffect, useState, type ComponentType } from 'react'
import 'leaflet/dist/leaflet.css'
import type { MoonPosition, PlateCrossing, SunPosition } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

type Props = {
  positions: MoonPosition[]
  sunPositions: SunPosition[]
  crossings: PlateCrossing[]
  showAntipode: boolean
  animate: boolean
  nextCrossing?: PlateCrossing
}

export function CordaroMap(props: Props) {
  const { t } = useI18n()
  const [MapInner, setMapInner] = useState<ComponentType<Props> | null>(null)

  useEffect(() => {
    let active = true
    import('./LeafletMapInner').then((module) => {
      if (active) setMapInner(() => module.LeafletMapInner)
    })
    return () => { active = false }
  }, [])

  return (
    <section
      aria-label={t('map.aria')}
      className="h-[46vh] min-h-[440px] shrink-0 overflow-hidden rounded-md border border-[#29313b] bg-[#0e1116]"
    >
      {MapInner ? (
        <MapInner {...props} />
      ) : (
        <div className="flex h-full items-center justify-center bg-[#0e1116] font-mono text-xs text-[#8b94a0]">
          {t('map.loading')}
        </div>
      )}
    </section>
  )
}
