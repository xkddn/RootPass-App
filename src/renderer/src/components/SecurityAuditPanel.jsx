import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, AlertTriangle, Clock, Pencil, CheckCircle2 } from 'lucide-react'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeOldAccounts,
  computeTotalIssues,
  MS_90_DAYS
} from '../utils/auditHelpers'

function AccountRow({ account, badge, badgeClass, onEdit }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 text-[13px] font-bold text-zinc-400">
        {account.title.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">{account.title}</p>
        <p className="truncate font-mono text-[11px] text-zinc-600">{account.login || '—'}</p>
      </div>
      {badge && <span className={`shrink-0 text-[11px] font-semibold ${badgeClass}`}>{badge}</span>}
      <button
        onClick={() => onEdit(account)}
        title={t('common.edit')}
        className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function Section({ icon: Icon, title, color, border, count, emptyText, children }) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${border} bg-white/[0.01]`}>
      <div className={`flex items-center gap-3 border-b ${border} bg-white/[0.015] px-4 py-3`}>
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-xl border ${border} bg-white/[0.04]`}
        >
          <Icon className={`size-3.5 ${color}`} aria-hidden="true" />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-white">{title}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${border} ${count > 0 ? color : 'text-zinc-700'}`}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <span className="text-[13px] text-zinc-600">{emptyText}</span>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] px-2 py-1">{children}</div>
      )}
    </div>
  )
}

export default function SecurityAuditPanel({ accounts, onEditAccount }) {
  const { t } = useTranslation()
  const weakAccounts = useMemo(() => computeWeakAccounts(accounts), [accounts])
  const duplicateGroups = useMemo(() => computeDuplicateGroups(accounts), [accounts])
  const oldAccounts = useMemo(() => computeOldAccounts(accounts), [accounts])
  const totalIssues = computeTotalIssues(weakAccounts, duplicateGroups, oldAccounts)

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400/70">
          <ShieldAlert className="size-3" aria-hidden="true" />
          {t('audit.eyebrow')}
        </p>
        <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">
          {t('audit.title')}
        </h1>
        <p className="mt-1 text-[13px] text-zinc-600">
          {totalIssues === 0 ? t('audit.allGood') : t('audit.issuesFound', { count: totalIssues })}
        </p>
      </div>

      <div className="space-y-4">
        <Section
          icon={ShieldAlert}
          title={t('audit.weakTitle')}
          color="text-red-400"
          border="border-red-500/20"
          count={weakAccounts.length}
          emptyText={t('audit.weakEmpty')}
        >
          {weakAccounts.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              badge={t('audit.weakBadge')}
              badgeClass="text-red-400"
              onEdit={onEditAccount}
            />
          ))}
        </Section>

        <Section
          icon={AlertTriangle}
          title={t('audit.dupTitle')}
          color="text-amber-400"
          border="border-amber-500/20"
          count={duplicateGroups.length}
          emptyText={t('audit.dupEmpty')}
        >
          {duplicateGroups.map((group, i) => (
            <div key={i}>
              {i > 0 && <div className="my-1 h-px bg-amber-500/10" />}
              {group.map((acc) => (
                <AccountRow
                  key={acc.id}
                  account={acc}
                  badge={t('audit.dupBadge', { count: group.length })}
                  badgeClass="text-amber-400"
                  onEdit={onEditAccount}
                />
              ))}
            </div>
          ))}
        </Section>

        <Section
          icon={Clock}
          title={t('audit.oldTitle')}
          color="text-sky-400"
          border="border-sky-500/20"
          count={oldAccounts.length}
          emptyText={t('audit.oldEmpty')}
        >
          {oldAccounts.map((acc) => {
            const date = acc.passwordUpdatedAt || acc.createdAt
            const days = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000))
            return (
              <AccountRow
                key={acc.id}
                account={acc}
                badge={t('audit.daysBadge', { count: days })}
                badgeClass="text-zinc-500"
                onEdit={onEditAccount}
              />
            )
          })}
        </Section>
      </div>
    </div>
  )
}
