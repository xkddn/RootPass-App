import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RefreshCw, X } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

/**
 * Toast discret en bas à droite qui suit la mise à jour automatique.
 * - téléchargement : barre de progression
 * - prête : bouton « Redémarrer pour installer »
 */
function UpdateNotification() {
  const { t } = useTranslation()
  const [state, setState] = useState(null) // { status, version, percent }
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const cleanup = window.api.onUpdaterStatus?.((data) => {
      setState(data)
      if (data?.status === 'available' || data?.status === 'downloaded') {
        setDismissed(false)
      }
    })
    return cleanup
  }, [])

  const status = state?.status
  const isDownloading = status === 'downloading' || status === 'available'
  const isReady = status === 'downloaded'

  if (dismissed || (!isDownloading && !isReady)) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9998] w-full max-w-xs rounded-2xl border border-white/[0.08] bg-(--surface-solid) p-4 shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
          {isReady ? (
            <RefreshCw className="size-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <Download className="size-4 text-emerald-400" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-bold leading-snug text-white">
            {isReady ? t('update.readyTitle') : t('update.downloadingTitle')}
          </h4>
          <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">
            {isReady
              ? t('update.readyDescription', { version: state?.version || '' })
              : t('update.downloadingDescription')}
          </p>

          {isDownloading && (
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${state?.percent || 0}%` }}
              />
            </div>
          )}

          {isReady && (
            <button
              onClick={() => window.api.installUpdate()}
              className={`mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-px hover:bg-emerald-400 ${FOCUS_RING}`}
            >
              {t('update.restartNow')}
            </button>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className={`-mr-1 -mt-1 rounded-lg p-1 text-zinc-600 transition-colors hover:text-zinc-300 ${FOCUS_RING}`}
          aria-label={t('common.close')}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default UpdateNotification
