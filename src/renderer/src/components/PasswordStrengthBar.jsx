import { useTranslation } from 'react-i18next'
import { getPasswordStrength } from '../utils/passwordGenerator'

const LEVELS = [
  { label: 'passwordGenerator.strengthWeak', color: 'bg-red-500', text: 'text-red-400' },
  { label: 'passwordGenerator.strengthFair', color: 'bg-amber-400', text: 'text-amber-400' },
  { label: 'passwordGenerator.strengthStrong', color: 'bg-emerald-500', text: 'text-emerald-400' }
]

export default function PasswordStrengthBar({ password }) {
  const { t } = useTranslation()
  const strength = getPasswordStrength(password)
  if (!strength) return null

  const { label, color, text } = LEVELS[strength - 1]

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? color : 'bg-white/[0.06]'}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${text}`}>{t(label)}</p>
    </div>
  )
}
