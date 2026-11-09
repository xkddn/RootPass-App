import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, CircleCheck, Clock, Copy, Layers, Pencil, ShieldAlert } from 'lucide-react'
import BrandLogo from './BrandLogo'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeTwinGroups,
  computeOldAccounts,
  computeTotalIssues
} from '../utils/auditHelpers'

function AccountRow({ account, badge, onEdit }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-4 rounded-full px-3 py-2.5 transition-colors hover:bg-(--hd-shell)">
      <BrandLogo title={account.title} size="sm" round />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-(--hd-ink)">{account.title}</p>
        <p className="truncate text-[13px] text-(--hd-mute)">{account.login || '-'}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-(--hd-shell) px-3 py-1 text-[12px] font-semibold text-(--hd-ink2) tabular-nums">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={() => onEdit(account)}
        aria-label={`${t('common.edit')} : ${account.title}`}
        title={t('common.edit')}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-(--hd-mute) transition-colors hover:bg-(--hd-card) hover:text-(--hd-ink)"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function Section({ icon: Icon, title, hint, count, emptyText, className = '', children }) {
  const iconClass = 'bg-(--hd-shell) text-(--hd-ink2)'
  return (
    <section className={`hd-card p-7 ${className}`}>
      <div className="flex items-center gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold tracking-tight text-(--hd-ink)">{title}</h2>
          <p className="text-[13px] text-(--hd-mute)">{hint}</p>
        </div>
        <span className="shrink-0 text-[22px] font-extrabold text-(--hd-ink) tabular-nums">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="mt-5 flex items-center gap-2.5 rounded-full bg-(--hd-shell) px-4 py-3">
          <CircleCheck className="size-4 shrink-0 text-(--hd-good)" aria-hidden="true" />
          <span className="text-[14px] font-semibold text-(--hd-ink2)">{emptyText}</span>
        </div>
      ) : (
        <div className="mt-5 space-y-1">{children}</div>
      )}
    </section>
  )
}

export default function SecurityAuditPanel({ accounts, onEditAccount }) {
  const { t } = useTranslation()
  const weakAccounts = useMemo(() => computeWeakAccounts(accounts), [accounts])
  const duplicateGroups = useMemo(() => computeDuplicateGroups(accounts), [accounts])
  const twinGroups = useMemo(() => computeTwinGroups(accounts), [accounts])
  const oldAccounts = useMemo(() => computeOldAccounts(accounts), [accounts])
  const totalIssues = computeTotalIssues(weakAccounts, duplicateGroups, twinGroups)

  return (
    <div className="px-5 pb-12 pt-7 lg:px-12 lg:pt-12">
      <div className="grid items-start gap-8 xl:grid-cols-2">
        <p className="px-1 text-[16px] text-(--hd-ink2) xl:col-span-2">
          {totalIssues === 0 ? t('audit.allGood') : t('audit.issuesFound', { count: totalIssues })}
        </p>

        <div className="flex min-w-0 flex-col gap-8">
          <Section
            icon={ShieldAlert}
            title={t('audit.weakTitle')}
            hint={t('audit.weakHint')}
            count={weakAccounts.length}
            emptyText={t('audit.weakEmpty')}
          >
            {weakAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                badge={t('audit.weakBadge')}
                onEdit={onEditAccount}
              />
            ))}
          </Section>

          <Section
            icon={Layers}
            title={t('audit.twinTitle')}
            hint={t('audit.twinHint')}
            count={twinGroups.reduce((s, g) => s + g.accounts.length, 0)}
            emptyText={t('audit.twinEmpty')}
          >
            {twinGroups.map((group, i) => (
              <div
                key={group.site + i}
                className={i > 0 ? 'mt-3 border-t border-(--hd-line) pt-3' : ''}
              >
                <div className="flex flex-wrap items-center gap-2 px-3 pb-1.5">
                  <span className="text-[13px] font-semibold text-(--hd-mute)">
                    {t('audit.twinGroup', { count: group.accounts.length })}
                  </span>
                  <span className="rounded-full bg-(--hd-warn-soft) px-2.5 py-0.5 text-[12px] font-semibold text-(--hd-warn)">
                    {t(`audit.twinReason.${group.reason}`)}
                  </span>
                </div>
                {group.accounts.map((acc) => (
                  <AccountRow key={acc.id} account={acc} onEdit={onEditAccount} />
                ))}
              </div>
            ))}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <Section
            icon={Copy}
            title={t('audit.dupTitle')}
            hint={t('audit.dupHint')}
            count={duplicateGroups.reduce((s, g) => s + g.length, 0)}
            emptyText={t('audit.dupEmpty')}
          >
            {duplicateGroups.map((group, i) => (
              <div key={i} className={i > 0 ? 'mt-3 border-t border-(--hd-line) pt-3' : ''}>
                {group.map((acc) => (
                  <AccountRow
                    key={acc.id}
                    account={acc}
                    badge={t('audit.dupBadge', { count: group.length })}
                    onEdit={onEditAccount}
                  />
                ))}
              </div>
            ))}
          </Section>
        </div>

        <details className="hd-card group p-7 xl:col-span-2">
          <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--hd-shell) text-(--hd-mute)">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-extrabold tracking-tight text-(--hd-ink)">
                {t('audit.oldTitle')}
              </h2>
              <p className="text-[13px] text-(--hd-mute)">{t('audit.oldHint')}</p>
            </div>
            <span className="shrink-0 text-[22px] font-extrabold text-(--hd-ink2) tabular-nums">
              {oldAccounts.length}
            </span>
            <ChevronDown
              className="size-5 shrink-0 text-(--hd-mute) transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          {oldAccounts.length === 0 ? (
            <div className="mt-5 flex items-center gap-2.5 rounded-full bg-(--hd-shell) px-4 py-3">
              <CircleCheck className="size-4 shrink-0 text-(--hd-good)" aria-hidden="true" />
              <span className="text-[14px] font-semibold text-(--hd-ink2)">
                {t('audit.oldEmpty')}
              </span>
            </div>
          ) : (
            <div className="mt-5 space-y-1">
              {oldAccounts.map((acc) => {
                const date = acc.passwordUpdatedAt || acc.createdAt
                const days = Math.floor(
                  (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000)
                )
                return (
                  <AccountRow
                    key={acc.id}
                    account={acc}
                    badge={t('audit.daysBadge', { count: days })}
                    onEdit={onEditAccount}
                  />
                )
              })}
            </div>
          )}
        </details>
      </div>
    </div>
  )
}
