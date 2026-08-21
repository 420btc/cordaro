'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth-context'

export type CrossingWatcher = { crossingId: string; time: string; plate: string; type: string; latitude: number; longitude: number; names: string[] }

type WatchersContextValue = {
  watchers: CrossingWatcher[]
  // Devuelve los nombres de quienes observan un cruce.
  namesFor: (crossingId: string) => string[]
  // Indica si el usuario actual observa ese cruce.
  isWatching: (crossingId: string) => boolean
  // Alterna la observación del cruce. Devuelve null si todo fue bien, o un error.
  toggleWatch: (crossing: { crossingId: string; time: string; plate: string; type: string; latitude: number; longitude: number }) => Promise<string | null>
}

const WatchersContext = createContext<WatchersContextValue | null>(null)

export function WatchersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [watchers, setWatchers] = useState<CrossingWatcher[]>([])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/watchers')
      const data = (await res.json()) as { watchers?: CrossingWatcher[] }
      if (res.ok && Array.isArray(data.watchers)) setWatchers(data.watchers)
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    const wrapped = () => { if (active) load() }
    wrapped()
    const timer = window.setInterval(wrapped, 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [load])

  const namesFor = useCallback((crossingId: string) => watchers.find((w) => w.crossingId === crossingId)?.names ?? [], [watchers])

  const isWatching = useCallback((crossingId: string) => {
    if (!user) return false
    return watchers.some((w) => w.crossingId === crossingId && w.names.includes(user.name))
  }, [watchers, user])

  const toggleWatch = useCallback(async (crossing: { crossingId: string; time: string; plate: string; type: string; latitude: number; longitude: number }) => {
    if (!user) return 'Unauthorized'
    try {
      if (isWatching(crossing.crossingId)) {
        await fetch(`/api/watchers?crossingId=${encodeURIComponent(crossing.crossingId)}`, { method: 'DELETE' })
      } else {
        await fetch('/api/watchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(crossing) })
      }
      await load()
      return null
    } catch {
      return 'Watchers error'
    }
  }, [user, isWatching, load])

  return <WatchersContext.Provider value={{ watchers, namesFor, isWatching, toggleWatch }}>{children}</WatchersContext.Provider>
}

export function useWatchers(): WatchersContextValue {
  const ctx = useContext(WatchersContext)
  if (!ctx) throw new Error('useWatchers debe usarse dentro de WatchersProvider')
  return ctx
}
