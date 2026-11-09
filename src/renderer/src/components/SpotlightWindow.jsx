import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n'
import { Search, Copy, Check, Plus, User, Star } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { applyTheme, getStoredTheme, normalizeTheme } from '../theme'

const BASE_HEIGHT = 240
const MAX_HEIGHT = 560
const OUTER_PAD = 24
const TOP_BLOCK = 16 + 56
const LIST_GAP = 12
const FOOTER_H = 44
const ROW_H = 64
const ROW_GAP = 8
const MAX_VISIBLE_ROWS = 5

async function loadAccounts(setAccounts) {
  try {
    const all = await window.api.getAllAccounts()
    setAccounts(all || [])
  } catch {
    setAccounts([])
  }
}

const NO_DRAG = { WebkitAppRegion: 'no-drag' }

export default function SpotlightWindow() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    applyTheme(getStoredTheme())
    window.api
      .getTheme?.()
      .then((v) => applyTheme(normalizeTheme(v)))
      .catch(() => {})
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
      window.api
        .getTheme?.()
        .then((v) => applyTheme(normalizeTheme(v)))
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
        if (a.entry_type === 'note') return false
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
    const listH = visibleRows * ROW_H + Math.max(0, visibleRows - 1) * ROW_GAP
    const desired = OUTER_PAD + TOP_BLOCK + LIST_GAP + listH + FOOTER_H
    window.api.resizeSpotlight?.(Math.min(MAX_HEIGHT, Math.max(BASE_HEIGHT, desired)))
  }, [searchQuery, filtered.length])

  const handleCopy = async (value, id) => {
    if (!value) return
    await window.api.copyToClipboard(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  return (
    <div className="h-screen w-full p-3 font-sans" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-(--hd-shell) text-(--hd-ink) shadow-(--hd-shadow-float) ring-1 ring-(--hd-line)">
        <div className="flex shrink-0 items-center gap-3 p-4 pb-0">
          <div className="relative flex-1" style={NO_DRAG}>
            <label htmlFor="spotlight-search" className="sr-only">
              {t('spotlight.searchPlaceholder')}
            </label>
            <Search
              className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-(--hd-mute)"
              aria-hidden="true"
            />
            <input
              id="spotlight-search"
              ref={inputRef}
              type="text"
              placeholder={t('spotlight.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="h-14 w-full rounded-full bg-(--hd-card) pl-13 pr-5 text-[16px] font-semibold text-(--hd-ink) shadow-(--hd-shadow-card) outline-none ring-1 ring-transparent placeholder:font-semibold placeholder:text-(--hd-mute) focus:ring-2 focus:ring-(--hd-accent)"
            />
          </div>
          <button
            type="button"
            onClick={() => window.api.openAddAccountFromSpotlight?.()}
            style={NO_DRAG}
            aria-label={t('spotlight.addAccount')}
            title={t('spotlight.addAccount')}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(--hd-accent) text-(--hd-on-accent) transition-[filter,transform] hover:brightness-110 active:scale-95"
          >
            <Plus className="size-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hd-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-3" style={NO_DRAG}>
          {searchQuery === '' ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[14px] text-(--hd-mute)">{t('spotlight.typeToSearch')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[14px] text-(--hd-mute)">{t('spotlight.noResults')}</p>
            </div>
          ) : (
            <div className="space-y-2" role="list">
              {filtered.map((account) => {
                const loginCopied = copiedId === `log-${account.id}`
                const passCopied = copiedId === `pass-${account.id}`
                return (
                  <div
                    key={account.id}
                    role="listitem"
                    className="flex h-16 items-center gap-3 rounded-full bg-(--hd-card) py-2 pl-3 pr-3 shadow-(--hd-shadow-card)"
                  >
                    <BrandLogo title={account.title} size="sm" round />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[15px] font-bold text-(--hd-ink)">
                          {account.title}
                        </span>
                        {!!account.is_favorite && (
                          <Star
                            className="size-3.5 shrink-0 fill-(--hd-warn) text-(--hd-warn)"
                            aria-label={t('dashboard.removeFromFavorites')}
                          />
                        )}
                      </div>
                      <span className="block truncate text-[13px] text-(--hd-mute)">
                        {account.login || '-'}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(account.login, `log-${account.id}`)}
                        aria-label={`${t('dashboard.copyUser')} : ${account.title}`}
                        title={t('dashboard.copyUser')}
                        className={`hd-pill min-h-10 px-3.5 ${loginCopied ? 'hd-pill-done' : 'hd-pill-soft'}`}
                      >
                        {loginCopied ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <User className="size-4" aria-hidden="true" />
                        )}
                        <span className="max-sm:hidden">
                          {loginCopied ? t('home.copied') : t('home.copyLogin')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(account.password, `pass-${account.id}`)}
                        aria-label={`${t('dashboard.copyPass')} : ${account.title}`}
                        title={t('dashboard.copyPass')}
                        className={`hd-pill min-h-10 px-3.5 ${passCopied ? 'hd-pill-done' : 'hd-pill-accent'}`}
                      >
                        {passCopied ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                        <span>{passCopied ? t('home.copied') : t('home.copyPassword')}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex h-11 shrink-0 items-center justify-end px-6">
          <span className="text-[12px] font-semibold text-(--hd-mute)">
            {t('spotlight.escToClose')}
          </span>
        </div>
      </div>
    </div>
  )
}
