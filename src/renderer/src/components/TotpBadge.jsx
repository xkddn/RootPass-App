import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { generate as totpGenerate } from 'otplib'
import { Copy, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50'

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
    return <span className="text-[11px] text-red-500/70">{t('totp.invalidKey')}</span>
  }

  const progress = (remaining / 30) * 100
  const urgent = remaining <= 5

  return (
    <div className="flex items-center gap-2">
      <div className="relative pb-1.5">
        <span
          className={`font-mono text-[13px] font-bold tracking-widest tabular-nums ${urgent ? 'text-red-400' : 'text-sky-400'}`}
        >
          {code.slice(0, 3)}&thinsp;{code.slice(3)}
        </span>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${urgent ? 'bg-red-400' : 'bg-sky-400'}`}
            style={{ width: `${progress}%`, transition: 'width 0.9s linear' }}
          />
        </div>
      </div>
      <button
        onClick={() => onCopy(code, copyId)}
        title={t('totp.copyCode')}
        className={`flex size-6 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400 transition-colors hover:border-sky-500/40 hover:bg-sky-500/20 ${FOCUS_RING}`}
      >
        {copiedId === copyId ? (
          <Check className="size-3 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="size-3" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export default TotpBadge
