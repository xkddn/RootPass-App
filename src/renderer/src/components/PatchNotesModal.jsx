import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, Wrench, Minus, PartyPopper, X } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

const SECTIONS = [
  {
    key: 'added',
    icon: Sparkles,
    tile: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    dot: 'bg-emerald-400'
  },
  {
    key: 'improved',
    icon: TrendingUp,
    tile: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
    dot: 'bg-sky-400'
  },
  {
    key: 'fixed',
    icon: Wrench,
    tile: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    dot: 'bg-violet-400'
  },
  {
    key: 'removed',
    icon: Minus,
    tile: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
    dot: 'bg-zinc-500'
  }
]

function formatDate(iso, lang) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function PatchNotesModal({ notes = [], onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!notes.length) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patchnotes-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-(--surface-solid) shadow-2xl shadow-black/60 animate-in zoom-in-95 fade-in duration-200">
        <div className="absolute -right-16 -top-16 size-44 rounded-full bg-emerald-500/10 blur-[80px]" aria-hidden="true" />

        <div className="relative flex items-start gap-4 border-b border-white/[0.06] px-6 pb-5 pt-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <PartyPopper className="size-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-400">
              {t('patchNotes.eyebrow')}
            </p>
            <h2 id="patchnotes-title" className="mt-0.5 text-xl font-bold tracking-tight text-white">
              {t('patchNotes.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            autoFocus
            aria-label={t('common.close')}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {notes.map((note) => {
            const content = note[lang] || note.fr
            return (
              <div key={note.version} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[12px] font-bold text-emerald-400">
                    v{note.version}
                  </span>
                  {note.date && (
                    <span className="text-[11px] text-zinc-600">{formatDate(note.date, lang)}</span>
                  )}
                  <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
                </div>

                {SECTIONS.map((section) => {
                  const items = content?.[section.key]
                  if (!items || items.length === 0) return null
                  const Icon = section.icon
                  return (
                    <div key={section.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-6 items-center justify-center rounded-lg border ${section.tile}`}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        <h3 className="text-[13px] font-semibold text-white">
                          {t(`patchNotes.sections.${section.key}`)}
                        </h3>
                      </div>
                      <ul className="space-y-4 pl-1" role="list">
                        {items.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-400">
                            <span
                              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${section.dot}`}
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default PatchNotesModal
