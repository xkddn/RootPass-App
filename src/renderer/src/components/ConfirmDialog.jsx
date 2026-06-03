import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0C0C10] p-6 shadow-2xl shadow-black/60 animate-in zoom-in-95 fade-in duration-200">
        <div
          className={`mb-4 flex size-10 items-center justify-center rounded-2xl border ${
            danger ? 'border-red-500/20 bg-red-500/10' : 'border-amber-500/20 bg-amber-500/10'
          }`}
        >
          <AlertTriangle
            className={`size-5 ${danger ? 'text-red-400' : 'text-amber-400'}`}
            aria-hidden="true"
          />
        </div>

        <h3 id="confirm-dialog-title" className="mb-1 text-[15px] font-bold text-white">
          {title}
        </h3>

        {description && (
          <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">{description}</p>
        )}

        <div className={description ? '' : 'mt-6'}>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className={`rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:border-white/[0.12] hover:text-zinc-200 ${FOCUS_RING}`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={`rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all ${FOCUS_RING} ${
                danger
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-400'
                  : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
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
