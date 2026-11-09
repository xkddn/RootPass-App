import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

/** @param {{ shortcut: string, onOk: (checked: boolean) => void }} props */
function BackgroundWarningModal({ shortcut, onOk }) {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-(--hd-scrim) backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-[28px] bg-(--hd-card) p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) shadow-lg">
          <ShieldCheck className="size-5 text-(--hd-accent)" aria-hidden="true" />
        </div>

        <h3 className="mb-2 text-[17px] font-bold leading-snug text-(--hd-ink)">
          {t('background.title')}
        </h3>

        <p className="mb-5 text-[14px] leading-relaxed text-(--hd-mute)">
          {t('background.description')}{' '}
          <span className="rounded-md border border-(--hd-line) bg-(--hd-shell) px-1.5 py-0.5 font-mono text-[13px] text-(--hd-ink2)">
            {shortcut}
          </span>
          .
        </p>

        <button
          type="button"
          onClick={() => setChecked((v) => !v)}
          className={`mb-5 flex w-full cursor-pointer items-center gap-2.5 text-left ${FOCUS_RING}`}
        >
          <div
            className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
              checked ? 'border-(--hd-accent) bg-(--hd-accent)' : 'border-(--hd-faint) bg-(--hd-shell)'
            }`}
          >
            {checked && <Check className="size-3 text-(--hd-on-accent)" aria-hidden="true" />}
          </div>
          <span className="text-[12px] text-(--hd-mute) transition-colors hover:text-(--hd-ink2)">
            {t('background.dontShowAgain')}
          </span>
        </button>

        <div className="flex justify-end">
          <button
            autoFocus
            onClick={() => onOk(checked)}
            className={`rounded-full bg-(--hd-accent) px-6 py-2.5 text-[13px] font-bold text-(--hd-on-accent) shadow-lg transition-all hover:-translate-y-px hover:brightness-110 ${FOCUS_RING}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default BackgroundWarningModal
