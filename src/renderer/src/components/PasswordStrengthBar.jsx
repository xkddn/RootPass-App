import { useTranslation } from 'react-i18next'
import { getPasswordStrength } from '../utils/passwordGenerator'

const LEVELS = [
  { label: 'passwordGenerator.strengthWeak', color: 'bg-(--hd-bad)', text: 'text-(--hd-bad)' },
  { label: 'passwordGenerator.strengthFair', color: 'bg-(--hd-warn)', text: 'text-(--hd-warn)' },
  { label: 'passwordGenerator.strengthStrong', color: 'bg-(--hd-accent)', text: 'text-(--hd-accent)' }
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
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? color : 'bg-(--hd-shell)'}`}
          />
        ))}
      </div>
      <p className={`text-[12px] font-semibold ${text}`}>{t(label)}</p>
    </div>
  )
}
