'use client'

import { useEffect, useState, type ComponentType } from 'react'
import 'leaflet/dist/leaflet.css'
import type { MoonPosition, PlateCrossing, SunPosition } from '@/lib/types'

type Props = {
  positions: MoonPosition[]
  sunPositions: SunPosition[]
  crossings: PlateCrossing[]
  showAntipode: boolean
  animate: boolean
}

export function CordaroMap(props: Props) {
  const [MapInner, setMapInner] = useState<ComponentType<Props> | null>(null)

  useEffect(() => {
    let active = true

    import('./LeafletMapInner').then((module) => {
      if (active) setMapInner(() => module.LeafletMapInner)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section
      aria-label="Mapa mundial de placas tectónicas y trayectoria lunar y solar"
      className="h-[46vh] min-h-[440px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]"
    >
      {MapInner ? (
        <MapInner {...props} />
      ) : (
        <div className="flex h-full items-center justify-center bg-[#0b1220] font-mono text-xs text-slate-400">
          Cargando cartografía…
        </div>
      )}
    </section>
  )
}
