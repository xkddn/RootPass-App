import { useTranslation } from 'react-i18next'
import { Check, Copy, ExternalLink, Pencil, Star, StickyNote, Trash2, User } from 'lucide-react'
import BrandLogo from '../BrandLogo'
import RowMenu from './RowMenu'

export const ROW_GRID =
  'grid items-center gap-x-4 grid-cols-[minmax(0,1fr)_162px] @xl:grid-cols-[minmax(0,1fr)_320px] @2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_320px] @4xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_320px]'

export function TableHeader() {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true" className={`${ROW_GRID} px-5 pb-2 hd-label`}>
      <span>{t('home.colName')}</span>
      <span className="hidden @2xl:block">{t('home.colLogin')}</span>
      <span className="hidden @4xl:block">{t('home.colUpdated')}</span>
      <span />
    </div>
  )
}

function CopyPill({ label, copiedLabel, copied, onClick, tone, ariaLabel, tabIndex, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`hd-pill min-h-9 px-3 ${copied ? 'hd-pill-done' : tone === 'accent' ? 'hd-pill-tint' : 'hd-pill-soft'}`}
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Icon className="size-4" aria-hidden="true" />
      )}
      <span className="hidden @xl:inline">{copied ? copiedLabel : label}</span>
    </button>
  )
}

export function AccountRow({
  account,
  categoryLabel,
  folderName,
  selected,
  tabbable,
  flags,
  dateLabel,
  copiedId,
  onSelect,
  onCopy,
  onToggleFavorite,
  onEdit,
  onDelete
}) {
  const { t } = useTranslation()
  const isNote = account.entry_type === 'note'
  const tabIndex = tabbable ? 0 : -1
  const loginCopied = copiedId === `login-${account.id}`
  const passCopied = copiedId === account.id
  const noteCopied = copiedId === `note-${account.id}`

  const menuItems = [
    { key: 'edit', label: t('common.edit'), icon: Pencil, onSelect: () => onEdit(account) },
    ...(account.url
      ? [
          {
            key: 'open',
            label: t('home.openUrl'),
            icon: ExternalLink,
            onSelect: () => window.open(account.url)
          }
        ]
      : []),
    {
      key: 'delete',
      label: t('common.delete'),
      icon: Trash2,
      danger: true,
      onSelect: () => onDelete(account.id)
    }
  ]

  return (
    <div
      role="listitem"
      onClick={() => onSelect(account.id)}
      className={`${ROW_GRID} group relative cursor-pointer rounded-full px-4 py-3 transition-[background-color,box-shadow] duration-150 ${
        selected
          ? 'bg-(--hd-card) shadow-(--hd-shadow-lift) ring-1 ring-(--hd-line)'
          : 'hover:bg-(--hd-card-hover)'
      }`}
    >
      <button
        type="button"
        data-row-main
        onClick={(e) => {
          e.stopPropagation()
          onSelect(account.id)
        }}
        tabIndex={tabIndex}
        aria-pressed={selected}
        className="flex min-w-0 items-center gap-3 rounded-full text-left"
      >
        {isNote ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-(--hd-accent)">
            <StickyNote className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <BrandLogo title={account.title} size="sm" round />
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-(--hd-ink)">
            {account.title}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] text-(--hd-mute)">
              {folderName ? `${categoryLabel} · ${folderName}` : categoryLabel}
            </span>
            {flags.map((f) => (
              <span
                key={f.key}
                className="shrink-0 rounded-full bg-(--hd-shell) px-2.5 py-0.5 text-[12px] font-semibold text-(--hd-ink2)"
              >
                {f.label}
              </span>
            ))}
          </span>
        </span>
      </button>

      <span className="hidden min-w-0 truncate text-[14px] text-(--hd-ink2) @2xl:block">
        {isNote ? '' : account.login}
      </span>

      <span className="hidden text-[13px] text-(--hd-mute) tabular-nums @4xl:block">
        {dateLabel}
      </span>

      <div className="flex items-center justify-end gap-1.5">
        {isNote ? (
          <CopyPill
            label={t('accountForm.copyNote')}
            copiedLabel={t('home.copied')}
            copied={noteCopied}
            icon={Copy}
            tone="accent"
            tabIndex={tabIndex}
            ariaLabel={`${t('accountForm.copyNote')} : ${account.title}`}
            onClick={() => onCopy(account.notes, `note-${account.id}`)}
          />
        ) : (
          <>
            <CopyPill
              label={t('home.copyLogin')}
              copiedLabel={t('home.copied')}
              copied={loginCopied}
              icon={User}
              tabIndex={tabIndex}
              ariaLabel={`${t('dashboard.copyUser')} : ${account.title}`}
              onClick={() => onCopy(account.login, `login-${account.id}`)}
            />
            <CopyPill
              label={t('home.copyPassword')}
              copiedLabel={t('home.copied')}
              copied={passCopied}
              icon={Copy}
              tone="accent"
              tabIndex={tabIndex}
              ariaLabel={`${t('dashboard.copyPass')} : ${account.title}`}
              onClick={() => onCopy(account.password, account.id)}
            />
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(account.id, account.is_favorite)
          }}
          tabIndex={tabIndex}
          aria-pressed={!!account.is_favorite}
          aria-label={
            account.is_favorite ? t('dashboard.removeFromFavorites') : t('dashboard.addToFavorites')
          }
          title={
            account.is_favorite ? t('dashboard.removeFromFavorites') : t('dashboard.addToFavorites')
          }
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-(--hd-shell) ${
            account.is_favorite ? 'text-(--hd-warn)' : 'text-(--hd-mute) hover:text-(--hd-ink)'
          }`}
        >
          <Star
            className="size-[18px]"
            fill={account.is_favorite ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
        <RowMenu
          label={`${t('home.moreActions')} : ${account.title}`}
          items={menuItems}
          tabIndex={tabIndex}
        />
      </div>
    </div>
  )
}
