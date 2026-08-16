'use client'
import { useEffect, useState } from 'react'
import { BadgeCheck, ExternalLink, MapPin } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type XUser = {
  screen_name: string
  name: string
  avatar_url: string
  description: string
  location: string
  followers: number
  following: number
  tweets: number
  url: string
  verification?: { verified?: boolean }
}

export function XProfile() {
  const { t } = useI18n()
  const [user, setUser] = useState<XUser | null>(null)

  useEffect(() => {
    let active = true
    fetch('https://api.fxtwitter.com/rrichcord')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => { if (active && data?.user) setUser(data.user) })
      .catch(() => { /* sin datos: se muestra el enlace directo */ })
    return () => { active = false }
  }, [])

  return (
    <section className="rounded-md border border-[#29313b] bg-[#151a21] p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-[#e7eaee]"><BadgeCheck className="size-4 text-[#e0a028]" /> {t('xprofile.title')}</h2>
      {user ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img src={user.avatar_url} alt={user.name} referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full border border-[#29313b]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-serif text-base font-bold text-[#e7eaee]">{user.name}</span>
              {user.verification?.verified && <BadgeCheck className="size-4 text-[#1d9bf0]" />}
              <span className="font-mono text-xs text-[#8b94a0]">@{user.screen_name}</span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-[#c5ccd4]">{user.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#8b94a0]">
              {user.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {user.location}</span>}
              <span>{user.followers.toLocaleString()} {t('xprofile.followers')}</span>
              <span>{user.following.toLocaleString()} {t('xprofile.following')}</span>
              <span>{user.tweets.toLocaleString()} {t('xprofile.posts')}</span>
            </div>
          </div>
          <a href={user.url} target="_blank" rel="noopener noreferrer" className="flex h-9 shrink-0 items-center gap-1.5 rounded border border-[#29313b] bg-[#1c232b] px-3 text-xs font-semibold text-[#e7eaee] hover:bg-[#29313b]">
            <ExternalLink className="size-4" /> {t('xprofile.view')}
          </a>
        </div>
      ) : (
        <a href="https://x.com/rrichcord" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#e0a028] hover:underline">
          @rrichcord · {t('xprofile.view')} <ExternalLink className="size-4" />
        </a>
      )}
    </section>
  )
}
