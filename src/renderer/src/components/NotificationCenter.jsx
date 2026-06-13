import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Wand2, CheckCheck, BellOff, ShieldAlert } from 'lucide-react'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeOldAccounts,
  computeTotalIssues
} from '../utils/auditHelpers'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

const REGISTRY = {
  'autofill-intro': {
    icon: Wand2,
    titleKey: 'notifications.autofillIntro.title',
    bodyKey: 'notifications.autofillIntro.body',
    actionKey: 'notifications.autofillIntro.action',
    action: 'openAutofill'
  }
}

function NotificationCenter({ accounts = [], onOpenAutofill, onOpenAudit }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef(null)

  const security = useMemo(() => {
    const weak = computeWeakAccounts(accounts)
    const dup = computeDuplicateGroups(accounts)
    const old = computeOldAccounts(accounts)
    const total = computeTotalIssues(weak, dup, old)
    if (total === 0) return null
    const dupCount = dup.reduce((s, g) => s + g.length, 0)
    return {
      id: `security:${weak.length}-${dupCount}-${old.length}`,
      tone: 'danger',
      icon: ShieldAlert,
      title: t('notifications.security.title'),
      body: t('notifications.security.body', {
        count: total,
        weak: weak.length,
        dup: dupCount,
        old: old.length
      }),
      actionKey: 'notifications.security.action',
      action: 'openAudit'
    }
  }, [accounts, t])

  const dynamicNotifs = useMemo(() => [security].filter(Boolean), [security])
  const extraIds = useMemo(() => dynamicNotifs.map((d) => d.id), [dynamicNotifs])
  const extraKey = extraIds.join(',')

  const refresh = useCallback(async () => {
    try {
      const state = await window.api.getNotifications(extraKey ? extraKey.split(',') : [])
      if (state) {
        setItems(state.items || [])
        setUnreadCount(state.unreadCount || 0)
      }
    } catch (e) {
      console.error('Erreur chargement notifications :', e)
    }
  }, [extraKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleMarkAll = async () => {
    try {
      const state = await window.api.markAllNotificationsRead(extraIds)
      if (state) {
        setItems(state.items || [])
        setUnreadCount(state.unreadCount || 0)
      }
    } catch (e) {
      console.error('Erreur marquage notifications :', e)
    }
  }

  const handleAction = async (entry, id) => {
    try {
      const state = await window.api.markNotificationRead(id)
      if (state) {
        setItems(state.items || [])
        setUnreadCount(state.unreadCount || 0)
      }
    } catch (e) {
      console.error('Erreur marquage notification :', e)
    }
    setOpen(false)
    if (entry.action === 'openAutofill') onOpenAutofill?.()
    if (entry.action === 'openAudit') onOpenAudit?.()
  }

  const describe = (it) => {
    const dynamic = dynamicNotifs.find((d) => d.id === it.id)
    if (dynamic) return dynamic
    const reg = REGISTRY[it.id]
    if (!reg) return null
    return {
      icon: reg.icon,
      title: t(reg.titleKey),
      body: t(reg.bodyKey),
      actionKey: reg.actionKey,
      action: reg.action,
      tone: 'default'
    }
  }

  const visible = items.map((it) => ({ it, entry: describe(it) })).filter((x) => x.entry)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.title')}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('notifications.title')}
        className={`relative flex items-center justify-center rounded-full border p-2.5 transition-all ${FOCUS_RING} ${
          open
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300'
        }`}
      >
        <Bell className="size-3.5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-zinc-950 ring-2 ring-(--app-bg)"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('notifications.title')}
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-white/[0.08] bg-(--surface-solid)/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-white">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[10px] font-bold text-emerald-400">
                  {unreadCount}
                </span>
              )}
            </h2>
            <button
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${FOCUS_RING} ${
                unreadCount === 0
                  ? 'cursor-default text-zinc-700'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
              }`}
            >
              <CheckCheck className="size-3" aria-hidden="true" />
              {t('notifications.markAllRead')}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <BellOff className="size-5 text-zinc-700" aria-hidden="true" />
              </div>
              <p className="text-[12px] text-zinc-600">{t('notifications.empty')}</p>
            </div>
          ) : (
            <ul className="max-h-[22rem] space-y-1 overflow-y-auto p-2" role="list">
              {visible.map(({ it, entry }) => {
                const Icon = entry.icon
                const danger = entry.tone === 'danger'
                const dot = danger ? 'bg-red-400' : 'bg-emerald-400'
                const tile = it.read
                  ? 'border-white/[0.06] bg-white/[0.02] text-zinc-600'
                  : danger
                    ? 'border-red-500/25 bg-red-500/10 text-red-400'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                const actionBtn = danger
                  ? 'bg-red-500 text-white hover:bg-red-400'
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                return (
                  <li
                    key={it.id}
                    className={`relative rounded-xl border p-3 transition-colors ${
                      it.read
                        ? 'border-transparent'
                        : danger
                          ? 'border-red-500/15 bg-red-500/[0.04]'
                          : 'border-white/[0.06] bg-white/[0.025]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${tile}`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {!it.read && (
                            <span
                              className={`size-1.5 shrink-0 rounded-full ${dot}`}
                              aria-hidden="true"
                            />
                          )}
                          <p className="truncate text-[13px] font-semibold text-white">
                            {entry.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-400">
                          {entry.body}
                        </p>
                        {entry.actionKey && (
                          <button
                            onClick={() => handleAction(entry, it.id)}
                            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all hover:-translate-y-px ${actionBtn} ${FOCUS_RING}`}
                          >
                            {t(entry.actionKey)}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
