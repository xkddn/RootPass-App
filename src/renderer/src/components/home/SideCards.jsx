import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, Clock, ClipboardCheck, ShieldAlert, Copy } from 'lucide-react'

export const CLIPBOARD_MS = 2 * 60 * 1000

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function HealthCard({ counts, onFilter, onAudit }) {
  const { t } = useTranslation()
  const total = counts.weak + counts.reused
  const rows = [
    { id: 'weak', label: t('home.weak'), icon: ShieldAlert, count: counts.weak },
    { id: 'reused', label: t('home.reused'), icon: Copy, count: counts.reused }
  ]

  return (
    <section className="hd-card p-8" aria-labelledby="hd-health-title">
      <h2 id="hd-health-title" className="text-[16px] font-extrabold tracking-tight text-(--hd-ink)">
        {t('home.health')}
      </h2>

      {total === 0 ? (
        <div className="mt-5 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--hd-good-soft) text-(--hd-good)">
            <Check className="size-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-(--hd-ink)">{t('home.healthOk')}</p>
            <p className="text-[13px] leading-snug text-(--hd-mute)">{t('home.healthOkHint')}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[44px] font-extrabold leading-none tracking-tight text-(--hd-ink) tabular-nums">
            {total}
          </p>
          <p className="mt-1 text-[13px] text-(--hd-mute)">{t('home.healthIssues', { count: total })}</p>
          <ul className="mt-6 space-y-2">
            {rows.map(({ id, label, icon: Icon, count }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onFilter(id)}
                  disabled={count === 0}
                  className="group flex w-full items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3 text-left transition-colors enabled:hover:bg-(--hd-shell) disabled:cursor-default"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      count > 0 ? 'bg-(--hd-shell) text-(--hd-ink2)' : 'bg-(--hd-shell) text-(--hd-faint)'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-(--hd-ink2)">{label}</span>
                  <span className="text-[14px] font-bold text-(--hd-ink) tabular-nums">{count}</span>
                  {count > 0 && (
                    <ChevronRight className="size-4 text-(--hd-faint) transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onAudit} className="hd-pill hd-pill-soft mt-6 w-full">
            {t('home.seeAudit')}
          </button>
        </>
      )}
    </section>
  )
}

export function ProtectionCard({ autoLockTime }) {
  const { t } = useTranslation()
  const lockValue = autoLockTime ? t('home.autoLockMin', { count: autoLockTime }) : t('home.autoLockOff')
  const rows = [
    { id: 'lock', label: t('home.autoLock'), value: lockValue, icon: Clock },
    { id: 'clip', label: t('home.clipboard'), value: t('home.clipboardRule'), icon: ClipboardCheck }
  ]
  return (
    <section className="hd-card p-8" aria-labelledby="hd-protect-title">
      <h2 id="hd-protect-title" className="text-[16px] font-extrabold tracking-tight text-(--hd-ink)">
        {t('home.protection')}
      </h2>
      <ul className="mt-5 space-y-4">
        {rows.map(({ id, label, value, icon: Icon }) => (
          <li key={id} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-(--hd-accent)">
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-(--hd-mute)">{label}</p>
              <p className="truncate text-[14px] font-bold text-(--hd-ink)">{value}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ClipboardPill({ until, onDone }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (!until) return
    setCleared(false)
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [until])

  const remaining = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0

  useEffect(() => {
    if (!until || remaining > 0) return
    setCleared(true)
    const id = setTimeout(() => onDone?.(), 3000)
    return () => clearTimeout(id)
  }, [until, remaining, onDone])

  if (!until) return null

  const progress = cleared ? 0 : (remaining * 1000) / CLIPBOARD_MS

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
      <div className="hd-rise pointer-events-auto flex items-center gap-3 rounded-full bg-(--hd-ink) py-2.5 pl-4 pr-5 text-(--hd-shell) shadow-(--hd-shadow-float)">
        <span className="sr-only" role="status">
          {cleared ? t('home.clipCleared') : t('home.clipAnnounce')}
        </span>
        <ClipboardCheck className="size-[18px] shrink-0" aria-hidden="true" />
        <span aria-hidden="true" className="text-[13px] font-semibold tabular-nums">
          {cleared ? t('home.clipCleared') : t('home.clipCountdown', { time: formatTime(remaining) })}
        </span>
        <span aria-hidden="true" className="h-1 w-16 overflow-hidden rounded-full bg-(--hd-shell)/25">
          <span className="block h-full rounded-full bg-(--hd-shell)" style={{ width: `${progress * 100}%` }} />
        </span>
      </div>
    </div>
  )
}
