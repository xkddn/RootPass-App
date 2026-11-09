import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, Wrench, Minus, PartyPopper, X } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

const SECTIONS = [
  {
    key: 'added',
    icon: Sparkles,
    tile: 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent)',
    dot: 'bg-(--hd-accent)'
  },
  {
    key: 'improved',
    icon: TrendingUp,
    tile: 'border-(--hd-good)/30 bg-(--hd-good-soft) text-(--hd-good)',
    dot: 'bg-(--hd-good)'
  },
  {
    key: 'fixed',
    icon: Wrench,
    tile: 'border-(--hd-warn)/30 bg-(--hd-warn-soft) text-(--hd-warn)',
    dot: 'bg-(--hd-warn)'
  },
  {
    key: 'removed',
    icon: Minus,
    tile: 'border-(--hd-line) bg-(--hd-line) text-(--hd-ink2)',
    dot: 'bg-(--hd-mute)'
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
  const pressedOnOverlay = useRef(false)

  const handleOverlayMouseDown = (e) => {
    pressedOnOverlay.current = e.target === e.currentTarget
  }

  const handleOverlayClick = (e) => {
    if (e.target !== e.currentTarget) return
    if (!pressedOnOverlay.current) return
    pressedOnOverlay.current = false
    onClose()
  }

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
        className="absolute inset-0 bg-(--hd-scrim) backdrop-blur-sm"
        onMouseDown={handleOverlayMouseDown}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div
          className="absolute -right-16 -top-16 size-44 rounded-full bg-(--hd-accent-soft) blur-[80px]"
          aria-hidden="true"
        />

        <div className="relative flex items-start gap-4 border-b border-(--hd-line) px-6 pb-5 pt-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft)">
            <PartyPopper className="size-5 text-(--hd-accent)" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-(--hd-accent)">
              {t('patchNotes.eyebrow')}
            </p>
            <h2
              id="patchnotes-title"
              className="mt-0.5 text-xl font-bold tracking-tight text-(--hd-ink)"
            >
              {t('patchNotes.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            autoFocus
            aria-label={t('common.close')}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2) transition-all hover:border-(--hd-faint) hover:bg-(--hd-shell) hover:text-(--hd-ink) ${FOCUS_RING}`}
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
                  <span className="rounded-full bg-(--hd-accent-soft) px-2.5 py-0.5 text-[12px] font-bold text-(--hd-accent)">
                    v{note.version}
                  </span>
                  {note.date && (
                    <span className="text-[12px] text-(--hd-mute)">{formatDate(note.date, lang)}</span>
                  )}
                  <span className="h-px flex-1 bg-(--hd-shell)" aria-hidden="true" />
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
                        <h3 className="text-[13px] font-semibold text-(--hd-ink)">
                          {t(`patchNotes.sections.${section.key}`)}
                        </h3>
                      </div>
                      <ul className="space-y-4 pl-1" role="list">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2.5 text-[13px] leading-relaxed text-(--hd-ink2)"
                          >
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
