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
import BrandMark from './home/BrandMark'

const CATEGORY_ICONS = {
  Personnel: User,
  Travail: Briefcase,
  Finance: Landmark,
  'Réseaux Sociaux': AtSign,
  'E-commerce': ShoppingCart,
  Divertissement: Tv,
  Santé: Activity,
  Education: BookOpen,
  Développement: Code2,
  Autres: Folder
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
    const fillable = accounts.filter((a) => a.entry_type !== 'note')
    const base = q
      ? fillable.filter(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.login?.toLowerCase().includes(q) ||
            a.url?.toLowerCase().includes(q)
        )
      : [...fillable]
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
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-(--hd-bg) font-sans text-(--hd-ink) selection:bg-(--hd-accent)/30">

      <div
        className="relative z-10 flex shrink-0 items-center gap-3 border-b border-(--hd-line) bg-(--hd-shell) px-4 py-3 backdrop-blur-xl"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <BrandMark className="size-7 shrink-0" />
        <p className="text-[13px] font-semibold text-(--hd-accent)">
          {t('autofill.fillTitle')}
        </p>
      </div>

      <div
        className="relative z-10 border-b border-(--hd-line) px-3 py-3"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <div className="relative rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-4 py-3 shadow-2xl ring-1 ring-inset ring-(--hd-line) backdrop-blur-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--hd-mute)" />
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
            className="h-full w-full bg-transparent pl-9 pr-2 text-[15px] font-medium text-(--hd-ink) placeholder:text-(--hd-mute) focus:outline-none"
          />
        </div>
      </div>

      <div ref={listRef} className="hd-scroll relative z-10 flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-(--hd-mute)">{t('spotlight.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((account, idx) => {
              const Icon = CATEGORY_ICONS[account.category] || CATEGORY_ICONS.Autres
              const isActive = idx === active
              return (
                <div
                  key={account.id}
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-lg transition-all duration-150 ${
                    isActive
                      ? 'border-(--hd-accent)/30 bg-(--hd-accent-soft)'
                      : 'border-(--hd-line) bg-(--hd-shell) hover:bg-(--hd-shell)'
                  }`}
                >
                  <button
                    onClick={() => fill(account, 'both')}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    title={t('autofill.fillBoth')}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2)">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold tracking-tight text-(--hd-ink)">
                          {account.title}
                        </span>
                        {!!account.is_favorite && (
                          <Star className="size-3 shrink-0 fill-(--hd-warn) text-(--hd-warn)" />
                        )}
                      </div>
                      <span className="mt-0.5 block truncate font-mono text-[12px] text-(--hd-mute)">
                        {account.login || '·'}
                      </span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => fill(account, 'login')}
                      title={t('autofill.fillLogin')}
                      className="flex size-7 items-center justify-center rounded-full border border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2) transition-colors hover:border-(--hd-faint) hover:bg-(--hd-shell) hover:text-(--hd-ink)"
                    >
                      <User className="size-3.5" />
                    </button>
                    <button
                      onClick={() => fill(account, 'password')}
                      title={t('autofill.fillPassword')}
                      className="flex size-7 items-center justify-center rounded-full border border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2) transition-colors hover:border-(--hd-faint) hover:bg-(--hd-shell) hover:text-(--hd-ink)"
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    <button
                      onClick={() => fill(account, 'both')}
                      title={t('autofill.fillBoth')}
                      className={`flex h-7 items-center justify-center rounded-full px-2.5 text-[12px] font-semibold transition-all ${
                        isActive
                          ? 'bg-(--hd-accent) text-(--hd-on-accent) hover:brightness-110'
                          : 'bg-(--hd-shell) text-(--hd-ink2)'
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

      <div className="relative z-10 flex h-7 shrink-0 items-center justify-between border-t border-(--hd-line) bg-(--hd-shell) px-4 backdrop-blur-xl">
        <span className="flex items-center gap-1.5 font-mono text-[12px] text-(--hd-mute)">
          <CornerDownLeft className="size-3" /> {t('autofill.fillHint')}
        </span>
        <span className="font-mono text-[12px] text-(--hd-mute)">{t('spotlight.escToClose')}</span>
      </div>
    </div>
  )
}
