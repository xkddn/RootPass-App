import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, Copy, Eye, EyeOff, Plus, StickyNote } from 'lucide-react'
import BrandLogo from '../BrandLogo'
import { REVEAL_MS, useReveal } from './useReveal'

function FeaturedCard({ account, reason, hasNext, onNext, hasAccounts, copiedId, onCopy, onAdd }) {
  const { t } = useTranslation()
  const [revealed, toggleReveal] = useReveal(account?.id)

  if (!account) {
    return (
      <div
        className="relative flex min-h-[250px] flex-col justify-between rounded-3xl p-8 text-(--hd-on-feature)"
        style={{ background: 'var(--hd-feature)', boxShadow: 'var(--hd-feature-shadow)' }}
      >
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-(--hd-on-feature)/85">
          {t('home.quick')}
        </p>
        <div>
          <p className="text-[24px] font-extrabold leading-tight tracking-tight">
            {t('home.quickEmpty')}
          </p>
          <p className="mt-1 max-w-[30ch] text-[14px] leading-snug text-(--hd-on-feature)/85">
            {t('home.quickEmptyHint')}
          </p>
        </div>
        {hasAccounts ? (
          <span aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="hd-pill w-fit bg-(--hd-on-feature) text-(--hd-feature-ink) hover:brightness-95"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('home.newAccount')}
          </button>
        )}
      </div>
    )
  }

  const isNote = account.entry_type === 'note'
  const passCopied = copiedId === `fc-pw-${account.id}`
  const loginCopied = copiedId === `fc-login-${account.id}`

  return (
    <div
      key={account.id}
      className="hd-rise relative flex min-h-[250px] flex-col justify-between rounded-3xl p-8 text-(--hd-on-feature)"
      style={{ background: 'var(--hd-feature)', boxShadow: 'var(--hd-feature-shadow)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-(--hd-on-feature)/85">
            {t('home.quick')}
          </p>
          {reason && <p className="mt-1 text-[12px] font-semibold text-(--hd-on-feature)/80">{t(reason)}</p>}
        </div>
        <div className="flex items-center gap-2">
          {hasNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label={t('home.quickNext')}
              title={t('home.quickNext')}
              className="flex size-8 items-center justify-center rounded-full bg-[#000]/20 text-(--hd-on-feature) transition-colors hover:bg-[#000]/30 focus-visible:outline-(--hd-on-feature)"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          )}
          {isNote ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-(--hd-on-feature) text-(--hd-feature-ink)">
              <StickyNote className="size-4" aria-hidden="true" />
            </span>
          ) : (
            <span className="rounded-full bg-(--hd-on-feature) p-0.5">
              <BrandLogo title={account.title} size="xs" round />
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[26px] font-extrabold leading-tight tracking-tight">
          {account.title}
        </p>
        {!isNote && (
          <div className="mt-2 flex h-8 items-center">
            {revealed ? (
              <span className="relative inline-block max-w-full pb-1.5">
                <span className="block truncate font-mono text-[18px] font-medium tracking-wide">
                  {account.password}
                </span>
                <span
                  aria-hidden="true"
                  className="hd-fuse absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-(--hd-on-feature)/70"
                  style={{ animationDuration: `${REVEAL_MS}ms` }}
                />
              </span>
            ) : (
              <span
                role="img"
                aria-label={t('home.hiddenPass')}
                className="select-none text-[22px] font-extrabold tracking-[0.18em]"
              >
                ****&nbsp;****&nbsp;****
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 basis-32 truncate text-[13px] font-semibold text-(--hd-on-feature)/90">
          {isNote ? '' : account.login}
        </p>
        {!isNote && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleReveal}
              aria-pressed={revealed}
              aria-label={revealed ? t('home.hide') : t('home.reveal')}
              title={revealed ? t('home.hide') : t('home.reveal')}
              className="flex size-9 items-center justify-center rounded-full bg-[#000]/20 text-(--hd-on-feature) transition-colors hover:bg-[#000]/30 focus-visible:outline-(--hd-on-feature)"
            >
              {revealed ? (
                <EyeOff className="size-[18px]" aria-hidden="true" />
              ) : (
                <Eye className="size-[18px]" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onCopy(account.login, `fc-login-${account.id}`)}
              className="hd-pill bg-[#000]/20 text-(--hd-on-feature) hover:bg-[#000]/30 focus-visible:outline-(--hd-on-feature)"
            >
              {loginCopied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {loginCopied ? t('home.copied') : t('home.copyLogin')}
            </button>
            <button
              type="button"
              onClick={() => onCopy(account.password, `fc-pw-${account.id}`)}
              className="hd-pill bg-(--hd-on-feature) text-(--hd-feature-ink) hover:brightness-95 focus-visible:outline-(--hd-on-feature)"
            >
              {passCopied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {passCopied ? t('home.copied') : t('home.copyPassword')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeaturedCard
