import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { generate as totpGenerate } from 'otplib'
import { Copy, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

function TotpBadge({ secret, onCopy, copiedId, copyId }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('------')
  const [remaining, setRemaining] = useState(30)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const compute = async () => {
      try {
        const cleaned = secret.replace(/\s/g, '').toUpperCase()
        const token = await totpGenerate({ secret: cleaned })
        setCode(String(token).padStart(6, '0'))
        setRemaining(30 - (Math.floor(Date.now() / 1000) % 30))
        setInvalid(false)
      } catch {
        setCode('------')
        setInvalid(true)
      }
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [secret])

  if (invalid) {
    return <span className="text-[12px] text-(--hd-bad)">{t('totp.invalidKey')}</span>
  }

  const progress = (remaining / 30) * 100
  const urgent = remaining <= 5

  return (
    <div className="flex items-center gap-2">
      <div className="relative pb-1.5">
        <span
          className={`font-mono text-[13px] font-bold tracking-widest tabular-nums ${urgent ? 'text-(--hd-bad)' : 'text-(--hd-accent)'}`}
        >
          {code.slice(0, 3)}&thinsp;{code.slice(3)}
        </span>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-full bg-(--hd-line)">
          <div
            className={`h-full rounded-full ${urgent ? 'bg-(--hd-bad)' : 'bg-(--hd-accent)'}`}
            style={{ width: `${progress}%`, transition: 'width 0.9s linear' }}
          />
        </div>
      </div>
      <button
        onClick={() => onCopy(code, copyId)}
        title={t('totp.copyCode')}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-(--hd-accent) transition-colors hover:brightness-95 ${FOCUS_RING}`}
      >
        {copiedId === copyId ? (
          <Check className="size-3 text-(--hd-good)" aria-hidden="true" />
        ) : (
          <Copy className="size-3" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export default TotpBadge
