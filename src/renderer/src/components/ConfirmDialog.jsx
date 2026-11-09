import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useEscape from '../utils/useEscape'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

/**
 * @param {{ title: string, description?: string, confirmLabel?: string, cancelLabel?: string, onConfirm: () => void, onCancel: () => void, danger?: boolean }} props
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false
}) {
  const { t } = useTranslation()
  useEscape(onCancel)
  const confirmText = confirmLabel ?? t('common.confirm')
  const cancelText = cancelLabel ?? t('common.cancel')
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="rp-overlay-in absolute inset-0 bg-(--hd-scrim) backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="rp-panel-in relative w-full max-w-sm rounded-[28px] bg-(--hd-card) p-6 shadow-2xl">
        <div
          className={`mb-4 flex size-10 items-center justify-center rounded-2xl border ${
            danger ? 'border-(--hd-bad)/30 bg-(--hd-bad-soft)' : 'border-(--hd-warn)/30 bg-(--hd-warn)/12'
          }`}
        >
          <AlertTriangle
            className={`size-5 ${danger ? 'text-(--hd-bad)' : 'text-(--hd-warn)'}`}
            aria-hidden="true"
          />
        </div>

        <h3 id="confirm-dialog-title" className="mb-1 text-[15px] font-bold text-(--hd-ink)">
          {title}
        </h3>

        {description && (
          <p className="mb-6 text-[13px] leading-relaxed text-(--hd-mute)">{description}</p>
        )}

        <div className={description ? '' : 'mt-6'}>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className={`rounded-full border border-(--hd-line) bg-(--hd-shell) px-4 py-2.5 text-[13px] font-medium text-(--hd-ink2) transition-all hover:border-(--hd-faint) hover:text-(--hd-ink) ${FOCUS_RING}`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={`rounded-full px-4 py-2.5 text-[13px] font-bold transition-all ${FOCUS_RING} ${
                danger
                  ? 'bg-(--hd-bad) text-(--hd-on-accent) shadow-lg hover:brightness-110'
                  : 'bg-(--hd-accent) text-(--hd-on-accent) shadow-lg hover:brightness-110'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
