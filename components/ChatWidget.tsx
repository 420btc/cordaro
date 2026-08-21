'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, LocateFixed, MessageCircle, Minus, Send, X } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'

type Msg = { id: number; name: string; body: string; createdAt: string }

export function ChatWidget() {
  const { t } = useI18n()
  const { user, register } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [tab, setTab] = useState<'global' | 'region'>('global')
  const [name, setName] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('cordaroChatName') ?? '' : ''))
  const [regionCell, setRegionCell] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [promptAccount, setPromptAccount] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  const offsetRef = useRef({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const listRef = useRef<HTMLDivElement>(null)

  const displayName = user ? user.name : name
  const room = tab === 'global' ? 'global' : regionCell ? `h3:${regionCell}` : ''

  const saveName = (v: string) => { setName(v); localStorage.setItem('cordaroChatName', v) }

  const load = useCallback(async () => {
    if (!room) return
    try {
      const res = await fetch(`/api/chat?room=${encodeURIComponent(room)}`)
      if (!res.ok) { setError(true); return }
      const data = (await res.json()) as { messages?: Msg[] }
      setMessages(data.messages ?? [])
      setError(false)
    } catch {
      setError(true)
    }
  }, [room])

  useEffect(() => {
    if (!open || minimized) return
    let active = true
    const wrapped = () => { if (active) load() }
    wrapped()
    const timer = window.setInterval(wrapped, 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [open, minimized, load])

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [messages])

  const useLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/chat/region?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
          if (res.ok) {
            const data = (await res.json()) as { cell: string }
            setRegionCell(data.cell)
            setError(false)
          }
        } catch {}
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 600000 },
    )
  }

  const send = async () => {
    const body = input.trim()
    if (!body || !displayName.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room, name: displayName.trim(), body }) })
      setInput('')
      await load()
      if (!user && !localStorage.getItem('cordaroChatPrompted')) setPromptAccount(true)
    } catch {}
    setSending(false)
  }

  const createAccount = async () => {
    if (pw !== pw2) { setPwError(t('auth.passwordMismatch')); return }
    setPwBusy(true)
    const err = await register(name.trim(), pw)
    setPwBusy(false)
    if (err) { setPwError(err); return }
    localStorage.setItem('cordaroChatPrompted', '1')
    setPromptAccount(false)
  }

  const dismissAccount = () => { localStorage.setItem('cordaroChatPrompted', '1'); setPromptAccount(false) }

  const startDrag = (e: React.PointerEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    const baseX = offsetRef.current.x
    const baseY = offsetRef.current.y
    const move = (ev: PointerEvent) => {
      offsetRef.current = { x: baseX + ev.clientX - startX, y: baseY + ev.clientY - startY }
      setOffset(offsetRef.current)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMinimized(false) }}
          className="fixed bottom-16 right-4 z-[900] flex items-center gap-2 rounded-full border border-[#5b8db8]/50 bg-[#151a21]/90 px-3 py-2 text-xs font-semibold text-[#5b8db8] shadow-lg backdrop-blur transition-colors hover:bg-[#1c232b]"
        >
          <MessageCircle className="size-4" /> {t('chat.button')}
        </button>
      )}

      {promptAccount && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={dismissAccount}>
          <div className="w-full max-w-xs rounded-md border border-[#29313b] bg-[#151a21] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-sm font-bold text-[#e7eaee]">{t('auth.createAccountTitle')}</h3>
            <p className="mt-1 text-xs text-[#8b94a0]">{t('auth.createAccountDesc')}</p>
            <div className="mt-3 space-y-2">
              <input value={name} onChange={(e) => saveName(e.target.value)} maxLength={24} placeholder={t('auth.name')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t('auth.password')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={t('auth.confirm')} className="w-full rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0]" />
            </div>
            {pwError && <p className="mt-2 text-xs text-[#c0564a]">{pwError}</p>}
            <button type="button" onClick={createAccount} disabled={pwBusy || !name.trim() || !pw} className="mt-3 w-full rounded-md bg-[#e0a028] px-4 py-2 text-sm font-bold text-[#0e1116] hover:bg-[#c88a1f] disabled:opacity-50">
              {pwBusy ? t('auth.loading') : t('auth.register')}
            </button>
            <button type="button" onClick={dismissAccount} className="mt-2 w-full rounded px-4 py-1.5 text-xs text-[#8b94a0] hover:text-[#e7eaee]">{t('auth.later')}</button>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed bottom-16 right-4 z-[950] w-80 max-w-[90vw] rounded-md border border-[#29313b] bg-[#151a21] shadow-2xl"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
          <header
            onPointerDown={startDrag}
            className="flex cursor-move items-center justify-between border-b border-[#29313b] px-3 py-2"
          >
            <h3 className="flex items-center gap-2 font-serif text-sm font-bold text-[#e7eaee]"><MessageCircle className="size-4 text-[#5b8db8]" /> {t('chat.title')}</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMinimized((v) => !v)} aria-label={t('chat.minimize')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><Minus className="size-4" /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('chat.close')} className="rounded p-1 text-[#8b94a0] hover:bg-[#29313b] hover:text-[#e7eaee]"><X className="size-4" /></button>
            </div>
          </header>

          {!minimized && (
            <>
              <div className="flex items-center gap-2 border-b border-[#29313b] px-3 py-2">
                {user ? (
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#5b8db8]">{t('chat.as')}: {displayName}</span>
                ) : (
                  <input
                    value={name}
                    onChange={(e) => saveName(e.target.value)}
                    maxLength={24}
                    placeholder={t('chat.name')}
                    className="min-w-0 flex-1 rounded border border-[#29313b] bg-[#0e1116] px-2 py-1 text-xs text-[#e7eaee] placeholder-[#8b94a0]"
                  />
                )}
                <div className="flex items-center gap-1 rounded border border-[#29313b] bg-[#1c232b] p-0.5">
                  <button type="button" onClick={() => setTab('global')} className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${tab === 'global' ? 'bg-[#5b8db8] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('chat.global')}</button>
                  <button type="button" onClick={() => setTab('region')} className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${tab === 'region' ? 'bg-[#5b8db8] text-[#0e1116]' : 'text-[#8b94a0] hover:text-[#e7eaee]'}`}>{t('chat.region')}</button>
                </div>
              </div>

              {tab === 'region' && !regionCell && (
                <div className="border-b border-[#29313b] px-3 py-2">
                  <button type="button" onClick={useLocation} disabled={locating} className="flex w-full items-center justify-center gap-2 rounded border border-[#5b8db8]/50 bg-[#5b8db8]/10 px-3 py-1.5 text-xs font-semibold text-[#5b8db8] hover:bg-[#5b8db8]/20 disabled:opacity-60">
                    {locating ? <Loader2 className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" />} {locating ? t('chat.locating') : t('chat.useLocation')}
                  </button>
                  <p className="mt-1.5 text-center text-[10px] text-[#8b94a0]">{t('chat.regionNeed')}</p>
                </div>
              )}
              {tab === 'region' && regionCell && (
                <p className="border-b border-[#29313b] px-3 py-1.5 text-center font-mono text-[10px] text-[#8b94a0]">{t('chat.regionHint')}: {regionCell}</p>
              )}

              <div ref={listRef} className="no-scrollbar h-64 space-y-2 overflow-y-auto px-3 py-2">
                {error && <p className="py-2 text-center text-xs text-[#c0564a]">{t('chat.error')}</p>}
                {!error && messages.length === 0 && <p className="py-4 text-center text-xs text-[#8b94a0]">{t('chat.empty')}</p>}
                {messages.map((m) => (
                  <div key={m.id} className="rounded-md border border-[#29313b] bg-[#0e1116] px-2.5 py-1.5">
                    <p className="font-mono text-[10px] text-[#8b94a0]"><span className="font-bold text-[#5b8db8]">{m.name}</span> · {format(new Date(m.createdAt), 'HH:mm')}</p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-[#e7eaee]">{m.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-[#29313b] px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                  maxLength={500}
                  placeholder={t('chat.placeholder')}
                  disabled={(tab === 'region' && !regionCell) || !displayName.trim()}
                  className="min-w-0 flex-1 rounded border border-[#29313b] bg-[#0e1116] px-2 py-1.5 text-xs text-[#e7eaee] placeholder-[#8b94a0] disabled:opacity-50"
                />
                <button type="button" onClick={send} disabled={sending || !input.trim() || !displayName.trim()} aria-label={t('chat.send')} className="flex size-8 items-center justify-center rounded bg-[#5b8db8] text-[#0e1116] hover:bg-[#6ba0d0] disabled:opacity-50">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
