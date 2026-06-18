import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n'
import {
  Search,
  Key,
  Copy,
  Check,
  Plus,
  User,
  Briefcase,
  Landmark,
  AtSign,
  Folder,
  ShoppingCart,
  Tv,
  Activity,
  BookOpen,
  Code2,
  Star
} from 'lucide-react'
import rootpassAppIcon from '../assets/rootpass-appicon.png'

const CATEGORY_META = {
  Personnel: { icon: User, dot: 'bg-emerald-400' },
  Travail: { icon: Briefcase, dot: 'bg-sky-400' },
  Finance: { icon: Landmark, dot: 'bg-amber-400' },
  'Réseaux Sociaux': { icon: AtSign, dot: 'bg-violet-400' },
  'E-commerce': { icon: ShoppingCart, dot: 'bg-orange-400' },
  Divertissement: { icon: Tv, dot: 'bg-fuchsia-400' },
  Santé: { icon: Activity, dot: 'bg-rose-400' },
  Education: { icon: BookOpen, dot: 'bg-cyan-400' },
  Développement: { icon: Code2, dot: 'bg-lime-400' },
  Autres: { icon: Folder, dot: 'bg-zinc-500' }
}

const BASE_HEIGHT = 240
const MAX_HEIGHT = 560
const HEADER_H = 58
const SEARCH_H = 62
const FOOTER_H = 28
const ROW_H = 56
const ROW_GAP = 8
const LIST_PAD = 16
const MAX_VISIBLE_ROWS = 6

async function loadAccounts(setAccounts) {
  try {
    const all = await window.api.getAllAccounts()
    setAccounts(all || [])
  } catch {
    setAccounts([])
  }
}

export default function SpotlightWindow() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadAccounts(setAccounts)
  }, [])

  useEffect(() => {
    const cleanup = window.api.onSpotlightShow?.(() => {
      window.api
        .getLocale?.()
        .then((loc) => {
          if (loc && loc !== i18n.language) i18n.changeLanguage(loc)
        })
        .catch(() => {})
      setSearchQuery('')
      loadAccounts(setAccounts)
      setTimeout(() => inputRef.current?.focus(), 50)
    })
    return cleanup
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') window.api.hideSpotlight?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = searchQuery.trim()
    ? accounts.filter((a) => {
        const q = searchQuery.toLowerCase()
        return (
          a.title?.toLowerCase().includes(q) ||
          a.login?.toLowerCase().includes(q) ||
          a.url?.toLowerCase().includes(q)
        )
      })
    : []

  useEffect(() => {
    if (searchQuery === '' || filtered.length === 0) {
      window.api.resizeSpotlight?.(BASE_HEIGHT)
      return
    }
    const visibleRows = Math.min(filtered.length, MAX_VISIBLE_ROWS)
    const listH = LIST_PAD + visibleRows * ROW_H + Math.max(0, visibleRows - 1) * ROW_GAP
    const desired = HEADER_H + SEARCH_H + listH + FOOTER_H
    window.api.resizeSpotlight?.(Math.min(MAX_HEIGHT, Math.max(BASE_HEIGHT, desired)))
  }, [searchQuery, filtered.length])

  const handleCopy = async (value, id) => {
    if (!value) return
    await window.api.copyToClipboard(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-(--app-bg) font-sans text-zinc-200 selection:bg-emerald-500/30">
      <div className="pointer-events-none absolute -left-40 -top-40 size-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-[-4rem] size-80 rounded-full bg-sky-500/5 blur-[100px]" />

      <div
        className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/6 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="flex items-center gap-3">
          <img src={rootpassAppIcon} className="size-7 shrink-0 rounded-lg" alt="RootPass" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
            {t('spotlight.quickSearch')}
          </p>
        </div>
        <button
          onClick={() => window.api.openAddAccountFromSpotlight?.()}
          style={{ WebkitAppRegion: 'no-drag' }}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[12px] font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-px hover:bg-emerald-400"
        >
          <Plus className="size-3.5 shrink-0" />
          {t('spotlight.addAccount')}
        </button>
      </div>

      <div
        className="relative z-10 border-b border-white/6 px-3 py-3"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <div className="relative rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.03] backdrop-blur-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('spotlight.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="h-full w-full bg-transparent pl-9 pr-2 text-[15px] font-medium text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto px-3 py-2">
        {searchQuery === '' ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-zinc-600">{t('spotlight.typeToSearch')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-zinc-600">{t('spotlight.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((account) => {
              const meta = CATEGORY_META[account.category] || CATEGORY_META.Autres
              const Icon = meta.icon
              return (
                <div
                  key={account.id}
                  className="group flex min-h-13 items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2.5 shadow-lg shadow-black/15 transition-all duration-150 hover:border-emerald-500/20 hover:bg-white/[0.05]"
                >
                  <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/6 bg-black/20 text-zinc-400 shadow-inner shadow-black/30">
                    <div className={`absolute inset-0 opacity-15 ${meta.dot}`} />
                    <Icon className="relative z-10 size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold tracking-tight text-white">
                        {account.title}
                      </span>
                      {!!account.is_favorite && (
                        <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                      {account.login || '—'}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(account.login, `log-${account.id}`)}
                      title={t('dashboard.copyUser')}
                      className="flex size-7 items-center justify-center rounded-lg border border-white/6 bg-black/25 text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                    >
                      {copiedId === `log-${account.id}` ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(account.password, `pass-${account.id}`)}
                      title={t('dashboard.copyPass')}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-[11px] font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition-all hover:-translate-y-px hover:bg-emerald-400"
                    >
                      {copiedId === `pass-${account.id}` ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Key className="size-3 opacity-70" />
                      )}
                      <span>{t('common.copy')}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="relative z-10 flex h-7 shrink-0 items-center justify-end border-t border-white/6 bg-black/30 px-4 backdrop-blur-xl">
        <span className="font-mono text-[10px] text-zinc-700">{t('spotlight.escToClose')}</span>
      </div>
    </div>
  )
}
