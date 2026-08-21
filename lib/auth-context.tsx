'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from './types'

export type Favorite = { crossingId: string; time: string; plate: string; type: string; latitude: number; longitude: number }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  favorites: Favorite[]
  login: (name: string, password: string) => Promise<string | null>
  register: (name: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  rename: (name: string) => Promise<string | null>
  isFavorite: (crossingId: string) => boolean
  toggleFavorite: (favorite: Favorite) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = (await res.json()) as { user: AuthUser | null }
        if (active) setUser(data.user)
      } catch {}
      try {
        const res = await fetch('/api/favorites')
        const data = (await res.json()) as { favorites: Favorite[] }
        if (active) setFavorites(data.favorites ?? [])
      } catch {}
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const login = async (name: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
      const data = (await res.json()) as { user?: AuthUser; error?: string }
      if (res.ok && data.user) {
        setUser(data.user)
        const fav = await fetch('/api/favorites')
        const favData = (await fav.json()) as { favorites: Favorite[] }
        setFavorites(favData.favorites ?? [])
        return null
      }
      return data.error ?? 'Login error'
    } catch {
      return 'Login error'
    }
  }

  const register = async (name: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
      const data = (await res.json()) as { user?: AuthUser; error?: string }
      if (res.ok && data.user) {
        setUser(data.user)
        setFavorites([])
        return null
      }
      return data.error ?? 'Register error'
    } catch {
      return 'Register error'
    }
  }

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    setUser(null)
    setFavorites([])
  }

  const rename = async (name: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/name', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      const data = (await res.json()) as { user?: AuthUser; error?: string }
      if (res.ok && data.user) { setUser(data.user); return null }
      return data.error ?? 'Name error'
    } catch {
      return 'Name error'
    }
  }

  const isFavorite = (crossingId: string) => favorites.some((f) => f.crossingId === crossingId)

  const toggleFavorite = async (favorite: Favorite) => {
    const existing = favorites.some((f) => f.crossingId === favorite.crossingId)
    if (existing) {
      setFavorites((prev) => prev.filter((f) => f.crossingId !== favorite.crossingId))
      await fetch(`/api/favorites?crossingId=${encodeURIComponent(favorite.crossingId)}`, { method: 'DELETE' })
    } else {
      setFavorites((prev) => [...prev, favorite])
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(favorite) })
    }
  }

  return <AuthContext.Provider value={{ user, loading, favorites, login, register, logout, rename, isFavorite, toggleFavorite }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
