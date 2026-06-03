import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

/** @param {{ shortcut: string, onOk: (checked: boolean) => void }} props */
function BackgroundWarningModal({ shortcut, onOk }) {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0C0C10] p-6 shadow-2xl shadow-black/60 animate-in zoom-in-95 fade-in duration-200">
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="size-5 text-emerald-400" aria-hidden="true" />
        </div>

        <h3 className="mb-2 text-[17px] font-bold leading-snug text-white">
          {t('background.title')}
        </h3>

        <p className="mb-5 text-[14px] leading-relaxed text-zinc-500">
          {t('background.description')}{' '}
          <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[13px] text-zinc-400">
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
              checked ? 'border-emerald-500 bg-emerald-500' : 'border-white/[0.15] bg-black/30'
            }`}
          >
            {checked && <Check className="size-3 text-zinc-950" aria-hidden="true" />}
          </div>
          <span className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-300">
            {t('background.dontShowAgain')}
          </span>
        </button>

        <div className="flex justify-end">
          <button
            autoFocus
            onClick={() => onOk(checked)}
            className={`rounded-xl bg-emerald-500 px-6 py-2.5 text-[13px] font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-px hover:bg-emerald-400 ${FOCUS_RING}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default BackgroundWarningModal
