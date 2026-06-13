import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, ArrowRight } from 'lucide-react'
import { generatePassword } from '../utils/passwordGenerator'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

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
  const strengthColors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500']
  const strengthTextColors = [
    'text-red-400',
    'text-orange-400',
    'text-yellow-400',
    'text-emerald-400'
  ]

  const charOptions = [
    { key: 'uppercase', label: 'A–Z' },
    { key: 'lowercase', label: 'a–z' },
    { key: 'numbers', label: '0–9' },
    { key: 'symbols', label: '!@#' }
  ]

  return (
    <div className="mt-2 rounded-xl border border-white/[0.07] bg-white/2.5 p-3.5 space-y-3 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-zinc-600 shrink-0">
          {t('passwordGenerator.length')}
        </span>
        <input
          type="range"
          min={6}
          max={64}
          value={length}
          onChange={handleLengthChange}
          className="flex-1 h-1 accent-emerald-500 cursor-pointer"
          aria-label={t('passwordGenerator.length')}
        />
        <span className="text-[13px] font-mono text-zinc-300 w-6 text-right tabular-nums">
          {length}
        </span>
      </div>

      <div className="flex gap-1.5">
        {charOptions.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleOption(key)}
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-mono font-bold transition-all ${FOCUS_RING} ${
              options[key]
                ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border border-white/5 bg-white/2 text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-white/[0.07] bg-black/40 px-3 py-2 text-[12px] font-mono text-zinc-300 truncate select-all">
            {preview}
          </div>
          <button
            type="button"
            onClick={() => regenerate()}
            aria-label={t('passwordGenerator.regenerate')}
            className={`shrink-0 rounded-xl border border-white/[0.07] bg-white/3 p-2 text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-300 ${FOCUS_RING}`}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onUse(preview)}
            aria-label={t('passwordGenerator.use')}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-[12px] font-semibold text-emerald-400 transition-all hover:bg-emerald-500/25 ${FOCUS_RING}`}
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
                  i <= strength ? strengthColors[strength] : 'bg-white/6'
                }`}
              />
            ))}
          </div>
          <span className={`text-[11px] font-semibold ${strengthTextColors[strength]}`}>
            {strengthLabels[strength]}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PasswordGeneratorPanel
