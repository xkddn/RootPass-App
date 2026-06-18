import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n'
import {
  Search,
  KeyRound,
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
  Star,
  CornerDownLeft
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

async function loadAccounts(setAccounts) {
  try {
    const all = await window.api.getAllAccounts()
    setAccounts(all || [])
  } catch {
    setAccounts([])
  }
}

export default function AutofillSelector() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState([])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    loadAccounts(setAccounts)
  }, [])

  useEffect(() => {
    const cleanup = window.api.onSelectorShow?.(() => {
      window.api
        .getLocale?.()
        .then((loc) => {
          if (loc && loc !== i18n.language) i18n.changeLanguage(loc)
        })
        .catch(() => {})
      setQuery('')
      setActive(0)
      loadAccounts(setAccounts)
      setTimeout(() => inputRef.current?.focus(), 40)
    })
    return cleanup
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? accounts.filter(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.login?.toLowerCase().includes(q) ||
            a.url?.toLowerCase().includes(q)
        )
      : [...accounts]
    return base.sort((a, b) => {
      if (!!b.is_favorite !== !!a.is_favorite) return b.is_favorite ? 1 : -1
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [accounts, query])

  const fill = (account, mode = 'both') => {
    if (account) window.api.fillAutofill?.(account.id, mode)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        window.api.cancelAutofill?.()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        fill(filtered[active], e.shiftKey ? 'password' : 'both')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, active])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-(--app-bg) font-sans text-zinc-200 selection:bg-emerald-500/30">
      <div className="pointer-events-none absolute -left-40 -top-40 size-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-[-4rem] size-80 rounded-full bg-sky-500/5 blur-[100px]" />

      <div
        className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/6 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <img src={rootpassAppIcon} className="size-7 shrink-0 rounded-lg" alt="RootPass" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
          {t('autofill.fillTitle')}
        </p>
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
            placeholder={t('autofill.searchPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            autoFocus
            className="h-full w-full bg-transparent pl-9 pr-2 text-[15px] font-medium text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <div ref={listRef} className="custom-scrollbar relative z-10 flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-zinc-600">{t('spotlight.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((account, idx) => {
              const meta = CATEGORY_META[account.category] || CATEGORY_META.Autres
              const Icon = meta.icon
              const isActive = idx === active
              return (
                <div
                  key={account.id}
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-lg shadow-black/15 transition-all duration-150 ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
                      : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <button
                    onClick={() => fill(account, 'both')}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    title={t('autofill.fillBoth')}
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
                        {account.login || '·'}
                      </span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => fill(account, 'login')}
                      title={t('autofill.fillLogin')}
                      className="flex size-7 items-center justify-center rounded-lg border border-white/6 bg-black/25 text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                    >
                      <User className="size-3.5" />
                    </button>
                    <button
                      onClick={() => fill(account, 'password')}
                      title={t('autofill.fillPassword')}
                      className="flex size-7 items-center justify-center rounded-lg border border-white/6 bg-black/25 text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    <button
                      onClick={() => fill(account, 'both')}
                      title={t('autofill.fillBoth')}
                      className={`flex h-7 items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                          : 'bg-white/[0.06] text-zinc-300'
                      }`}
                    >
                      {t('autofill.fill')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="relative z-10 flex h-7 shrink-0 items-center justify-between border-t border-white/6 bg-black/30 px-4 backdrop-blur-xl">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-700">
          <CornerDownLeft className="size-3" /> {t('autofill.fillHint')}
        </span>
        <span className="font-mono text-[10px] text-zinc-700">{t('spotlight.escToClose')}</span>
      </div>
    </div>
  )
}
