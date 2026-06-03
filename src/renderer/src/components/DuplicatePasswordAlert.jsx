import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'

function computeDuplicateGroups(accounts) {
  const map = {}
  accounts.forEach((acc) => {
    if (!acc.password) return
    if (!map[acc.password]) map[acc.password] = []
    map[acc.password].push(acc.title)
  })
  return Object.values(map).filter((g) => g.length > 1)
}

export default function DuplicatePasswordAlert({ accounts }) {
  const { t } = useTranslation()
  const [showToast, setShowToast] = useState(false)
  const prevCount = useRef(0)

  const duplicateGroups = useMemo(() => computeDuplicateGroups(accounts), [accounts])

  useEffect(() => {
    const count = duplicateGroups.length
    if (count === 0) {
      prevCount.current = 0
      setShowToast(false)
      return
    }
    if (count !== prevCount.current) {
      prevCount.current = count
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 30000)
      return () => clearTimeout(timer)
    }
  }, [duplicateGroups.length])

  if (duplicateGroups.length === 0) return null

  const displayGroups = duplicateGroups.slice(0, 4)
  const extraCount = duplicateGroups.length - 4

  if (showToast) {
    return (
      <div className="fixed right-4 bottom-4 z-50 w-80 animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-[#141410] shadow-2xl shadow-black/60">
          <div className="h-px w-full bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                <AlertTriangle className="size-4 text-amber-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white">{t('audit.dupTitle')}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {t('duplicate.groupsDetected', { count: duplicateGroups.length })}
                </p>
                <div className="mt-3 space-y-2">
                  {displayGroups.map((group, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/70"
                        aria-hidden="true"
                      />
                      <p className="text-[11px] leading-5 text-zinc-400">
                        <span className="font-semibold text-zinc-200">{group.join(', ')}</span>{' '}
                        {t('duplicate.sharePassword')}
                      </p>
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <p className="pl-3.5 text-[11px] text-zinc-600">
                      {t('duplicate.moreGroups', { count: extraCount })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowToast(false)}
                aria-label={t('common.close')}
                className="shrink-0 rounded-lg p-1 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-400"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="h-0.5 bg-white/4">
            <div
              className="h-full bg-amber-500/50"
              style={{ animation: 'shrink-width 30s linear forwards' }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 group">
      <button
        aria-label={t('duplicate.ariaLabel', { count: duplicateGroups.length })}
        className="flex size-8 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 transition-all hover:border-amber-500/40 hover:bg-amber-500/15 hover:shadow-lg hover:shadow-amber-500/10"
      >
        <AlertTriangle className="size-4" aria-hidden="true" />
      </button>

      <div
        className="pointer-events-none absolute right-0 bottom-10 w-72 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        role="tooltip"
      >
        <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-[#141410] shadow-2xl shadow-black/60">
          <div className="h-px w-full bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-400">
              {t('audit.dupTitle')}
            </p>
            <div className="space-y-1.5">
              {displayGroups.map((group, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/70"
                    aria-hidden="true"
                  />
                  <p className="text-[11px] leading-5 text-zinc-400">
                    <span className="font-semibold text-zinc-200">{group.join(', ')}</span>{' '}
                    {t('duplicate.sharePassword')}
                  </p>
                </div>
              ))}
              {extraCount > 0 && (
                <p className="pl-3.5 text-[11px] text-zinc-600">
                  {t('duplicate.more', { count: extraCount })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
