'use client'
import { useEffect, useState } from 'react'
import { Check, Heart, LogOut, User, X } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'

export function AccountMenu() {
  const { t } = useI18n()
  const { user, loading, favorites, login, register, logout, rename, toggleFavorite } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [profileName, setProfileName] = useState('')

  useEffect(() => { if (user) { setProfileName(user.name); setName(user.name) } }, [user])

  const submit = async () => {
    setError(null)
    setBusy(true)
    const err = mode === 'login' ? await login(name.trim(), password) : await register(name.trim(), password)
    setBusy(false)
    if (err) { setError(err); return }
    setPassword('')
    setConfirm('')
  }

  const saveName = async () => {
    setError(null)
    const err = await rename(profileName.trim())
    if (err) setError(err)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]"
      >
        <User className="size-4" />
        {!loading && user ? user.name : t('auth.account')}
      </button>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="no-scrollbar max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-md border border-[#29313b] bg-[#151a21] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-[#e7eaee]">{user ? t('auth.profile') : t('auth.title')}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('auth.close')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-5" /></button>
            </header>

            {!user ? (
              <>
                <div className="mb-3 flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
                  <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${mode === 'login' ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('auth.login')}</button>
                  <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${mode === 'register' ? 'bg-[#e0a028] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('auth.register')}</button>
                </div>

                <div className="space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder={t('auth.name')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.password')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />
                  {mode === 'register' && <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.confirm')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />}
                </div>

                {error && <p className="mt-2 text-xs text-[#c0564a]">{error}</p>}

                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !name.trim() || !password || (mode === 'register' && password !== confirm)}
                  className="mt-3 w-full rounded-md bg-[#e0a028] px-4 py-2 text-sm font-bold text-[#0e1116] hover:bg-[#c88a1f] disabled:opacity-50"
                >
                  {busy ? t('auth.loading') : mode === 'login' ? t('auth.login') : t('auth.register')}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]">{t('auth.name')}</p>
                  <div className="flex items-center gap-2">
                    <input value={profileName} onChange={(e) => setProfileName(e.target.value)} maxLength={24} className="min-w-0 flex-1 rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee]" />
                    <button type="button" onClick={saveName} className="flex size-8 items-center justify-center rounded bg-[#6aa86f] text-[#0e1116] hover:bg-[#7cb97f]"><Check className="size-4" /></button>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-[#8b94a0]">{t('auth.memberSince')}: {format(new Date(user.createdAt), 'dd/MM/yyyy')}</p>

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8b94a0]"><Heart className="size-3.5 text-[#c0564a]" /> {t('auth.favorites')} ({favorites.length})</p>
                  {favorites.length === 0 ? (
                    <p className="text-xs text-[#8b94a0]">{t('auth.noFavorites')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {favorites.map((f) => (
                        <div key={f.crossingId} className="flex items-center justify-between gap-2 rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5">
                          <span className="font-mono text-[10px] text-[#e7eaee]">{f.time} · {f.plate}</span>
                          <button type="button" onClick={() => toggleFavorite(f)} aria-label={t('auth.remove')} className="rounded p-0.5 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#c0564a]"><X className="size-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded border border-[#29313b] bg-[#1c232b] px-4 py-2 text-xs font-semibold text-[#c0564a] hover:bg-[#29313b]"><LogOut className="size-4" /> {t('auth.logout')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
