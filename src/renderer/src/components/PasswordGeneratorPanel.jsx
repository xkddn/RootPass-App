import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, ArrowRight } from 'lucide-react'
import { generatePassword } from '../utils/passwordGenerator'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

const DEFAULT_OPTIONS = { uppercase: true, lowercase: true, numbers: true, symbols: true }
const DEFAULT_LENGTH = 16

function getStrength(length, options) {
  if (length < 8) return 0
  const charsetCount = Object.values(options).filter(Boolean).length
  const score = (charsetCount / 4) * 0.4 + Math.min((length - 6) / 58, 1) * 0.6
  if (score >= 0.75) return 3
  if (score >= 0.45) return 2
  if (score >= 0.2) return 1
  return 0
}

/** @param {{ onUse: (password: string) => void }} props */
function PasswordGeneratorPanel({ onUse }) {
  const { t } = useTranslation()
  const [length, setLength] = useState(DEFAULT_LENGTH)
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [preview, setPreview] = useState(() => generatePassword(DEFAULT_LENGTH, DEFAULT_OPTIONS))

  const regenerate = useCallback(
    (newLength = length, newOptions = options) => {
      setPreview(generatePassword(newLength, newOptions))
    },
    [length, options]
  )

  const handleLengthChange = (e) => {
    const l = Number(e.target.value)
    setLength(l)
    regenerate(l, options)
  }

  const toggleOption = (key) => {
    const next = { ...options, [key]: !options[key] }
    if (!Object.values(next).some(Boolean)) return
    setOptions(next)
    regenerate(length, next)
  }

  const strength = getStrength(length, options)
  const strengthLabels = [
    t('passwordGenerator.strengthWeak'),
    t('passwordGenerator.strengthFair'),
    t('passwordGenerator.strengthGood'),
    t('passwordGenerator.strengthStrong')
  ]
  const strengthColors = ['bg-(--hd-bad)', 'bg-(--hd-warn)', 'bg-(--hd-accent)', 'bg-(--hd-good)']
  const strengthTextColors = [
    'text-(--hd-bad)',
    'text-(--hd-warn)',
    'text-(--hd-accent)',
    'text-(--hd-good)'
  ]

  const charOptions = [
    { key: 'uppercase', label: 'A–Z' },
    { key: 'lowercase', label: 'a–z' },
    { key: 'numbers', label: '0–9' },
    { key: 'symbols', label: '!@#' }
  ]

  return (
    <div className="mt-2 rounded-xl border border-(--hd-line) bg-(--hd-card) p-3.5 space-y-3 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-(--hd-ink2) shrink-0">
          {t('passwordGenerator.length')}
        </span>
        <input
          type="range"
          min={6}
          max={64}
          value={length}
          onChange={handleLengthChange}
          className="flex-1 h-1 accent-(--hd-accent) cursor-pointer"
          aria-label={t('passwordGenerator.length')}
        />
        <span className="text-[13px] font-mono text-(--hd-ink2) w-6 text-right tabular-nums">
          {length}
        </span>
      </div>

      <div className="flex gap-1.5">
        {charOptions.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleOption(key)}
            className={`flex-1 rounded-full py-1.5 text-[12px] font-mono font-bold transition-all ${FOCUS_RING} ${
              options[key]
                ? 'border border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent)'
                : 'border border-(--hd-line) bg-(--hd-card) text-(--hd-mute) hover:text-(--hd-ink2)'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-(--hd-line) bg-(--hd-shell) px-3 py-2 text-[12px] font-mono text-(--hd-ink2) truncate select-all">
            {preview}
          </div>
          <button
            type="button"
            onClick={() => regenerate()}
            aria-label={t('passwordGenerator.regenerate')}
            className={`shrink-0 rounded-full border border-(--hd-line) bg-(--hd-shell) p-2 text-(--hd-mute) transition-colors hover:border-(--hd-faint) hover:text-(--hd-ink2) ${FOCUS_RING}`}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onUse(preview)}
            aria-label={t('passwordGenerator.use')}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-3 py-1.5 text-[12px] font-semibold text-(--hd-accent) transition-all hover:bg-(--hd-accent)/25 ${FOCUS_RING}`}
          >
            <ArrowRight className="size-3.5" aria-hidden="true" />
            {t('passwordGenerator.use')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength ? strengthColors[strength] : 'bg-(--hd-shell)'
                }`}
              />
            ))}
          </div>
          <span className={`text-[12px] font-semibold ${strengthTextColors[strength]}`}>
            {strengthLabels[strength]}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PasswordGeneratorPanel
