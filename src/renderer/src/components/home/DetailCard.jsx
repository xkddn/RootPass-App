import { useTranslation } from 'react-i18next'
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  FolderOpen,
  Pencil,
  Star,
  StickyNote,
  Trash2,
  X
} from 'lucide-react'
import BrandLogo from '../BrandLogo'
import TotpBadge from '../TotpBadge'
import { REVEAL_MS, useReveal } from './useReveal'

function Field({ label, value, copyId, secret, mono, copiedId, onCopy, resetKey }) {
  const { t } = useTranslation()
  const [revealed, toggle] = useReveal(resetKey)
  const hidden = secret && !revealed
  const copied = copiedId === copyId

  return (
    <div>
      <p className="hd-label mb-1.5">{label}</p>
      <div className="flex items-center gap-1 rounded-2xl bg-(--hd-shell) py-1.5 pl-4 pr-1.5">
        <div className="relative min-w-0 flex-1">
          {hidden ? (
            <span
              role="img"
              aria-label={t('home.hiddenPass')}
              className="block select-none truncate text-[16px] font-extrabold tracking-[0.2em] text-(--hd-ink)"
            >
              ******** ****
            </span>
          ) : (
            <span
              className={`block truncate text-[15px] text-(--hd-ink) ${mono ? 'font-mono' : 'font-semibold'} ${
                value ? '' : 'text-(--hd-mute)'
              }`}
            >
              {value || '-'}
            </span>
          )}
          {secret && revealed && (
            <span
              aria-hidden="true"
              className="hd-fuse absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-(--hd-accent)"
              style={{ animationDuration: `${REVEAL_MS}ms` }}
            />
          )}
        </div>
        {secret && value && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={revealed}
            aria-label={revealed ? t('home.hide') : t('home.reveal')}
            title={revealed ? t('home.hide') : t('home.reveal')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-(--hd-ink2) transition-colors hover:bg-(--hd-card) hover:text-(--hd-ink)"
          >
            {revealed ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onCopy(value, copyId)}
            aria-label={`${t('common.copy')} : ${label}`}
            title={t('common.copy')}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              copied
                ? 'bg-(--hd-good-soft) text-(--hd-good)'
                : 'text-(--hd-ink2) hover:bg-(--hd-card) hover:text-(--hd-ink)'
            }`}
          >
            {copied ? <Check className="size-[18px]" aria-hidden="true" /> : <Copy className="size-[18px]" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  )
}

function DetailCard({ account, folders, categoryLabel, copiedId, onCopy, onToggleFavorite, onEdit, onDelete, onClose }) {
  const { t } = useTranslation()
  const folder = account.folder_id && folders.find((f) => f.id === account.folder_id)
  const isNote = account.entry_type === 'note'

  return (
    <aside
      key={account.id}
      aria-label={t('home.details')}
      className="hd-card hd-rise flex max-h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 pb-4 pt-6">
        {isNote ? (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-(--hd-accent)">
            <StickyNote className="size-5" aria-hidden="true" />
          </span>
        ) : (
          <BrandLogo title={account.title} size="md" round />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[18px] font-extrabold leading-tight tracking-tight text-(--hd-ink)">
            {account.title}
          </h2>
          <p className="truncate text-[13px] text-(--hd-mute)">{categoryLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          title={t('common.close')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-(--hd-mute) transition-colors hover:bg-(--hd-shell) hover:text-(--hd-ink)"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <div className="hd-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        {isNote ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="hd-label">{t('accountForm.notesLabel')}</p>
              {account.notes && (
                <button
                  type="button"
                  onClick={() => onCopy(account.notes, `preview-note-${account.id}`)}
                  className="hd-pill min-h-8 px-3 hd-pill-soft"
                >
                  {copiedId === `preview-note-${account.id}` ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {t('common.copy')}
                </button>
              )}
            </div>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-(--hd-shell) px-4 py-3 font-mono text-[13px] leading-relaxed text-(--hd-ink)">
              {account.notes || '-'}
            </pre>
          </div>
        ) : (
          <>
            <Field
              label={t('accountForm.loginLabel')}
              value={account.login}
              copyId={`preview-login-${account.id}`}
              copiedId={copiedId}
              onCopy={onCopy}
              resetKey={account.id}
            />
            <Field
              label={t('accountForm.passwordLabel')}
              value={account.password}
              copyId={`preview-pwd-${account.id}`}
              copiedId={copiedId}
              onCopy={onCopy}
              resetKey={account.id}
              secret
              mono
            />
          </>
        )}

        {!isNote && account.url && (
          <div>
            <p className="hd-label mb-1.5">{t('accountForm.urlLabel')}</p>
            <button
              type="button"
              onClick={() => window.open(account.url)}
              title={account.url}
              className="flex w-full items-center gap-2.5 rounded-2xl bg-(--hd-shell) px-4 py-3 text-left text-[14px] font-semibold text-(--hd-accent) transition-colors hover:bg-(--hd-line)"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{account.url}</span>
            </button>
          </div>
        )}

        {account.totp_secret && (
          <div>
            <p className="hd-label mb-1.5">{t('settings.tab2fa')}</p>
            <div className="rounded-2xl bg-(--hd-shell) px-4 py-3">
              <TotpBadge
                secret={account.totp_secret}
                onCopy={onCopy}
                copiedId={copiedId}
                copyId={`preview-totp-${account.id}`}
              />
            </div>
          </div>
        )}

        {folder && (
          <div>
            <p className="hd-label mb-1.5">{t('accountForm.folderLabel')}</p>
            <div className="flex items-center gap-2.5 rounded-2xl bg-(--hd-shell) px-4 py-3 text-[14px] font-semibold text-(--hd-ink)">
              <FolderOpen className="size-4 shrink-0 text-(--hd-mute)" aria-hidden="true" />
              <span className="truncate">{folder.name}</span>
            </div>
          </div>
        )}

        {account.tags?.length > 0 && (
          <div>
            <p className="hd-label mb-1.5">{t('accountForm.tagsLabel')}</p>
            <div className="flex flex-wrap gap-1.5">
              {account.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-(--hd-accent-soft) px-3 py-1 text-[12px] font-bold text-(--hd-accent)"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {account.custom_fields?.length > 0 && (
          <div className="space-y-4 border-t border-(--hd-line) pt-4">
            {account.custom_fields.map((field, i) => (
              <Field
                key={i}
                label={field.label}
                value={field.value}
                copyId={`preview-cf-${account.id}-${i}`}
                copiedId={copiedId}
                onCopy={onCopy}
                resetKey={account.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-(--hd-line) px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleFavorite(account.id, account.is_favorite)}
          aria-pressed={!!account.is_favorite}
          aria-label={account.is_favorite ? t('dashboard.removeFromFavorites') : t('dashboard.addToFavorites')}
          title={account.is_favorite ? t('dashboard.removeFromFavorites') : t('dashboard.addToFavorites')}
          className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-(--hd-shell) ${
            account.is_favorite ? 'text-(--hd-warn)' : 'text-(--hd-mute) hover:text-(--hd-ink)'
          }`}
        >
          <Star className="size-5" fill={account.is_favorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onEdit(account)} className="hd-pill hd-pill-accent min-h-10 flex-1">
          <Pencil className="size-4" aria-hidden="true" />
          {t('common.edit')}
        </button>
        <button
          type="button"
          onClick={() => onDelete(account.id)}
          aria-label={t('common.delete')}
          title={t('common.delete')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-(--hd-mute) transition-colors hover:bg-(--hd-bad-soft) hover:text-(--hd-bad)"
        >
          <Trash2 className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

export default DetailCard
