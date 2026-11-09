import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCheck, BellOff, Lightbulb, ScrollText } from 'lucide-react'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeTwinGroups,
  computeTotalIssues
} from '../utils/auditHelpers'
import { PATCH_NOTES } from '../data/patchnotes'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

const REGISTRY = {}

function NotificationCenter({ accounts = [], onOpenAudit }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef(null)

  const security = useMemo(() => {
    const weak = computeWeakAccounts(accounts)
    const dup = computeDuplicateGroups(accounts)
    const twins = computeTwinGroups(accounts)
    const total = computeTotalIssues(weak, dup, twins)
    if (total === 0) return null
    const dupCount = dup.reduce((s, g) => s + g.length, 0)
    const twinCount = twins.reduce((s, g) => s + g.accounts.length, 0)
    const parts = []
    if (weak.length || dupCount) {
      parts.push(t('notifications.security.body', { weak: weak.length, dup: dupCount }))
    }
    if (twinCount) parts.push(t('notifications.security.twins', { count: twinCount }))
    return {
      id: `security:${weak.length}-${dupCount}-${twinCount}`,
      tone: 'default',
      icon: Lightbulb,
      title: t('notifications.security.title'),
      body: parts.join(' '),
      actionKey: 'notifications.security.action',
      action: 'openAudit'
    }
  }, [accounts, t])

  const patchnotes = useMemo(() => {
    const latest = PATCH_NOTES[0]
    if (!latest) return null
    return {
      id: `patchnotes:${latest.version}`,
      version: latest.version,
      tone: 'default',
      icon: ScrollText,
      title: t('notifications.patchnotes.title'),
      body: t('notifications.patchnotes.body', { version: latest.version }),
      actionKey: 'notifications.patchnotes.action',
      action: 'openPatchnotes'
    }
  }, [t])

  const dynamicNotifs = useMemo(
    () => [security, patchnotes].filter(Boolean),
    [security, patchnotes]
  )
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
    if (entry.action === 'openAudit') onOpenAudit?.()
    if (entry.action === 'openPatchnotes') {
      window.dispatchEvent(
        new CustomEvent('rootpass:show-patchnotes', { detail: { version: entry.version } })
      )
    }
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
        className={`hd-icon-btn relative ${open ? 'text-(--hd-accent)' : ''}`}
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-(--hd-bad) text-[12px] font-extrabold text-(--hd-card) ring-2 ring-(--hd-shell)"
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
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-[28px] bg-(--hd-card) shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-(--hd-line) px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-(--hd-ink)">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="rounded-full bg-(--hd-accent-soft) px-1.5 py-px text-[12px] font-bold text-(--hd-accent)">
                  {unreadCount}
                </span>
              )}
            </h2>
            <button
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${FOCUS_RING} ${
                unreadCount === 0
                  ? 'cursor-default text-(--hd-mute)'
                  : 'text-(--hd-ink2) hover:bg-(--hd-shell) hover:text-(--hd-ink)'
              }`}
            >
              <CheckCheck className="size-3" aria-hidden="true" />
              {t('notifications.markAllRead')}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-card) p-3">
                <BellOff className="size-5 text-(--hd-mute)" aria-hidden="true" />
              </div>
              <p className="text-[12px] text-(--hd-mute)">{t('notifications.empty')}</p>
            </div>
          ) : (
            <ul className="max-h-[22rem] space-y-1 overflow-y-auto p-2" role="list">
              {visible.map(({ it, entry }) => {
                const Icon = entry.icon
                const danger = entry.tone === 'danger'
                const dot = danger ? 'bg-(--hd-bad)' : 'bg-(--hd-accent)'
                const tile = it.read
                  ? 'border-(--hd-line) bg-(--hd-card) text-(--hd-mute)'
                  : danger
                    ? 'border-(--hd-bad)/30 bg-(--hd-bad-soft) text-(--hd-bad)'
                    : 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent)'
                const actionBtn = danger
                  ? 'bg-(--hd-bad) text-(--hd-ink) hover:brightness-110'
                  : 'bg-(--hd-accent) text-(--hd-on-accent) hover:brightness-110'
                return (
                  <li
                    key={it.id}
                    className={`relative rounded-xl border p-3 transition-colors ${
                      it.read
                        ? 'border-transparent'
                        : danger
                          ? 'border-(--hd-bad)/30 bg-(--hd-bad-soft)'
                          : 'border-(--hd-line) bg-(--hd-card)'
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
                          <p className="truncate text-[13px] font-semibold text-(--hd-ink)">
                            {entry.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-(--hd-ink2)">
                          {entry.body}
                        </p>
                        {entry.actionKey && (
                          <button
                            onClick={() => handleAction(entry, it.id)}
                            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold transition-all hover:-translate-y-px ${actionBtn} ${FOCUS_RING}`}
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

