import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  Keyboard,
  MousePointerClick,
  Puzzle,
  RefreshCw,
  Copy,
  Shield,
  Rocket,
  Laptop
} from 'lucide-react'
import { setTheme, getStoredTheme } from '../theme'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-emerald-500'
              : i < current
              ? 'w-2 h-2 bg-emerald-500/40'
              : 'w-2 h-2 bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
        checked ? 'bg-emerald-500' : 'bg-white/[0.1]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ChoiceCard({ active, onClick, icon: Icon, label, desc, badge }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${FOCUS_RING} ${
        active
          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
          : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
      }`}
    >
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <Check className="size-3 text-zinc-950" aria-hidden="true" />
        </span>
      )}
      <div className={`flex size-10 items-center justify-center rounded-xl border transition-colors ${
        active ? 'border-emerald-500/30 bg-emerald-500/15' : 'border-white/[0.07] bg-white/[0.04]'
      }`}>
        <Icon className={`size-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} aria-hidden="true" />
      </div>
      <div>
        <p className={`text-[13px] font-semibold ${active ? 'text-emerald-300' : 'text-zinc-200'}`}>
          {label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
      </div>
    </button>
  )
}

function StepWrapper({ children, visible }) {
  return (
    <div
      className={`transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'
      }`}
    >
      {children}
    </div>
  )
}

function StepWelcome({ onNext }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center text-center gap-8 py-4">
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-emerald-500/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20">
          <Shield className="size-9 text-emerald-400" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
          RootPass
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          {t('onboarding.welcomeTitle')}
        </h1>
        <p className="text-base leading-relaxed text-zinc-400 max-w-xs mx-auto">
          {t('onboarding.welcomeSubtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2">
        <div className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-[11px] text-zinc-500">{t('onboarding.welcomeLocal')}</span>
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        {t('onboarding.start')}
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function StepLanguage({ onNext, onBack }) {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState(i18n.language === 'en' ? 'en' : 'fr')

  const handleSelect = async (code) => {
    setLang(code)
    await window.api.setLocale?.(code)
    i18n.changeLanguage(code)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.langTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.langTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.langDesc')}</p>
      </div>

      <div role="radiogroup" aria-label={t('onboarding.langTitle')} className="grid grid-cols-2 gap-4">
        <ChoiceCard
          active={lang === 'fr'}
          onClick={() => handleSelect('fr')}
          icon={Globe}
          label={t('onboarding.langFr')}
          desc="Langue par defaut"
        />
        <ChoiceCard
          active={lang === 'en'}
          onClick={() => handleSelect('en')}
          icon={Globe}
          label={t('onboarding.langEn')}
          desc="Default language"
        />
      </div>

      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  )
}

function StepTheme({ onNext, onBack }) {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState(getStoredTheme())

  const handleSelect = (next) => {
    setThemeState(setTheme(next))
  }

  const themes = [
    {
      id: 'dark',
      icon: Moon,
      label: t('onboarding.themeDark'),
      desc: t('onboarding.themeDarkDesc'),
      shell: 'bg-[#08080a]',
      bar: 'bg-[#34343a]',
      card: 'bg-[#17171b]',
      line: 'bg-[#34343a]'
    },
    {
      id: 'light',
      icon: Sun,
      label: t('onboarding.themeLight'),
      desc: t('onboarding.themeLightDesc'),
      shell: 'bg-[#ece8dd]',
      bar: 'bg-[#d6d2c6]',
      card: 'bg-[#ffffff]',
      line: 'bg-[#d6d2c6]'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.themeTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.themeTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.themeDesc')}</p>
      </div>

      <div role="radiogroup" aria-label={t('onboarding.themeTitle')} className="grid grid-cols-2 gap-4">
        {themes.map(({ id, icon: Icon, label, desc, shell, bar, card, line }) => {
          const active = theme === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(id)}
              className={`group relative flex flex-col gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${FOCUS_RING} ${
                active
                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              {active && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <Check className="size-3 text-zinc-950" aria-hidden="true" />
                </span>
              )}
              <div
                className={`flex h-20 flex-col gap-2 overflow-hidden rounded-xl border border-black/10 p-3 ${shell}`}
                aria-hidden="true"
              >
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className={`h-2 w-10 rounded-full ${bar}`} />
                </div>
                <div className={`flex-1 rounded-lg p-2 ${card}`}>
                  <div className={`h-1.5 w-3/4 rounded-full ${line}`} />
                  <div className={`mt-1.5 h-1.5 w-1/2 rounded-full ${line}`} />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon className={`size-4 shrink-0 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} aria-hidden="true" />
                <div>
                  <p className={`text-[13px] font-semibold ${active ? 'text-emerald-300' : 'text-zinc-200'}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  )
}

function StepSpotlight({ onNext, onBack }) {
  const { t } = useTranslation()
  const [shortcut, setShortcut] = useState('CommandOrControl+Shift+P')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.api.getShortcut?.().then((s) => s && setShortcut(s))
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const handleKeyDown = (e) => {
      e.preventDefault()
      if (e.key === 'Escape') { setIsRecording(false); return }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      if (!e.ctrlKey && !e.metaKey && !e.altKey) { setError(t('settings.comboError')); return }
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      const KEY_MAP = { ' ': 'Space', '+': 'Plus', '-': 'Minus' }
      keys.push(KEY_MAP[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key))
      const newShortcut = keys.join('+')
      setShortcut(newShortcut)
      setError(null)
      setIsRecording(false)
      window.api.setShortcut?.(newShortcut)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, t])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.spotlightTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.spotlightTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.spotlightDesc')}</p>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
            <Keyboard className="size-4 text-emerald-400" aria-hidden="true" />
          </div>
          <label className="text-[13px] font-semibold text-zinc-200" htmlFor="shortcut-display">
            {t('settings.spotlightShortcut')}
          </label>
        </div>

        <div className="flex items-center gap-3">
          <div
            id="shortcut-display"
            className={`flex-1 rounded-xl border px-4 py-3 font-mono text-sm transition-colors ${
              isRecording
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-white/[0.07] bg-black/30 text-zinc-300'
            }`}
          >
            {isRecording ? t('settings.pressCombo') : shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
          </div>
          <button
            onClick={() => { setError(null); setIsRecording(true) }}
            disabled={isRecording}
            className={`rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${FOCUS_RING} ${
              isRecording
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.07]'
            }`}
          >
            {isRecording ? t('settings.recording') : t('common.edit')}
          </button>
          {isRecording && (
            <span className="text-xs text-zinc-500 animate-pulse">{t('settings.escToCancel')}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  )
}

function StepAutofill({ onNext, onBack, onSelectMethod }) {
  const { t } = useTranslation()
  const [method, setMethod] = useState(null)

  const handleSelect = (m) => {
    setMethod(m)
    onSelectMethod(m)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.autofillTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.autofillTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.autofillDesc')}</p>
      </div>

      <div role="radiogroup" aria-label={t('onboarding.autofillTitle')} className="grid grid-cols-1 gap-4">
        <ChoiceCard
          active={method === 'shortcut'}
          onClick={async () => {
            handleSelect('shortcut')
            await window.api.setAutofillEnabled?.(true)
          }}
          icon={MousePointerClick}
          label={t('onboarding.autofillOptShortcutLabel')}
          desc={t('onboarding.autofillOptShortcutDesc')}
        />
        <ChoiceCard
          active={method === 'extension'}
          onClick={async () => {
            handleSelect('extension')
            await window.api.setBridgeEnabled?.(true)
          }}
          icon={Puzzle}
          label={t('onboarding.autofillOptExtensionLabel')}
          desc={t('onboarding.autofillOptExtensionDesc')}
          badge={t('onboarding.autofillRecommended')}
        />
      </div>

      <StepNav onNext={onNext} onBack={onBack} nextDisabled={!method} />
    </div>
  )
}

function StepExtensionTuto({ onNext, onBack }) {
  const { t } = useTranslation()
  const [code, setCode] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [paired, setPaired] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchCode = useCallback(async () => {
    const res = await window.api.getBridgePairingCode?.()
    if (res?.code) {
      setCode(res.code)
      setExpiresAt(res.expiresAt)
    }
  }, [])

  useEffect(() => {
    fetchCode()
    const unsub = window.api.onBridgeStatus?.((s) => {
      if (s.paired) setPaired(true)
    })
    return () => unsub?.()
  }, [fetchCode])

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) { setCode(null); setExpiresAt(null) }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [expiresAt])

  const handleCopy = () => {
    if (!code) return
    window.api.copyToClipboard?.(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const steps = [
    t('onboarding.extTutoStep1'),
    t('onboarding.extTutoStep2'),
    t('onboarding.extTutoStep3')
  ]

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.extTutoTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.extTutoTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.extTutoDesc')}</p>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
              {i + 1}
            </span>
            <p className="text-[13px] text-zinc-400 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      {paired ? (
        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 animate-in zoom-in duration-200"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
            <Check className="size-4 text-zinc-950" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-emerald-300">{t('onboarding.extPaired')}</p>
            <p className="text-xs text-emerald-400/70">{t('onboarding.extPairedDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-5 py-4 space-y-4" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-zinc-300">{t('onboarding.extCodeLabel')}</p>
            {code && remaining > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                {t('onboarding.extCodeExpires', { seconds: remaining })}
              </span>
            )}
            {(!code || remaining <= 0) && (
              <span className="text-[11px] text-red-400">{t('onboarding.extCodeExpired')}</span>
            )}
          </div>

          {code && remaining > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {code.split('').map((d, i) => (
                  <span
                    key={i}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 font-mono text-lg font-bold tabular-nums text-white"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <button
                onClick={handleCopy}
                aria-label={t('totp.copyCode')}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20 ${FOCUS_RING}`}
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
              <button
                onClick={fetchCode}
                className={`ml-auto flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-zinc-300 transition-all hover:bg-white/[0.08] ${FOCUS_RING}`}
              >
                <RefreshCw className="size-3" />
                {t('onboarding.extNewCode')}
              </button>
            </div>
          ) : (
            <button
              onClick={fetchCode}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <RefreshCw className="size-3.5" />
              {t('onboarding.extNewCode')}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200 ${FOCUS_RING}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('onboarding.back')}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onNext}
            className={`flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200 ${FOCUS_RING}`}
          >
            {t('onboarding.later')}
          </button>
          <button
            onClick={onNext}
            disabled={!paired}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
              paired
                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:bg-emerald-400'
                : 'bg-white/[0.05] text-zinc-500 cursor-not-allowed'
            }`}
          >
            {t('onboarding.continue')}
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StepHint({ onNext, onBack }) {
  const { t } = useTranslation()
  const [hint, setHint] = useState('')

  const handleNext = async () => {
    await window.api.setMasterHint?.(hint)
    onNext()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.hintStep')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.hintTitle')}</h2>
        <p className="mt-2 text-sm text-zinc-500">{t('onboarding.hintDesc')}</p>
      </div>

      <div className="space-y-2">
        <label className="ml-1 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          {t('onboarding.hintLabel')}
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value.slice(0, 120))}
          placeholder={t('onboarding.hintPlaceholder')}
          rows={3}
          className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-700 resize-none transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="ml-1 text-[11px] text-zinc-600 tabular-nums">{hint.length}/120</p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400/80">{t('onboarding.hintWarning')}</p>
      </div>

      <StepNav onNext={handleNext} onBack={onBack} />
    </div>
  )
}

function StepSystem({ onFinish, onBack }) {
  const { t } = useTranslation()
  const [autoStart, setAutoStart] = useState(false)
  const [autoLockTime, setAutoLockTime] = useState(15)

  useEffect(() => {
    window.api.getAutoStart?.().then((v) => v !== undefined && setAutoStart(v))
    window.api.getAutoLock?.().then((v) => v !== undefined && setAutoLockTime(v))
  }, [])

  const handleAutoStart = async (val) => {
    setAutoStart(val)
    await window.api.setAutoStart?.(val)
  }

  const handleAutoLock = (val) => {
    setAutoLockTime(val)
    window.api.setAutoLock?.(val)
  }

  const lockOptions = [
    { value: 0, label: t('onboarding.autolockNever') },
    { value: 1, label: t('onboarding.autolockMinute', { count: 1 }) },
    { value: 5, label: t('onboarding.autolockMinute', { count: 5 }) },
    { value: 15, label: t('onboarding.autolockMinute', { count: 15 }) },
    { value: 30, label: t('onboarding.autolockMinute', { count: 30 }) },
    { value: 60, label: t('onboarding.autolockHour', { count: 1 }) }
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500 mb-3">
          {t('onboarding.sysTitle')}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white">{t('onboarding.sysTitle')}</h2>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04]">
        <div className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
              <Rocket className="size-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="toggle-autostart"
                className="block text-[13px] font-semibold text-zinc-200 cursor-pointer"
              >
                {t('onboarding.autostartLabel')}
              </label>
              <p className="text-xs text-zinc-500 truncate">{t('onboarding.autostartDesc')}</p>
            </div>
          </div>
          <Toggle id="toggle-autostart" checked={autoStart} onChange={handleAutoStart} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
              <Laptop className="size-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <label htmlFor="autolock-select" className="block text-[13px] font-semibold text-zinc-200">
                {t('onboarding.autolockLabel')}
              </label>
              <p className="text-xs text-zinc-500">{t('onboarding.autolockDesc')}</p>
            </div>
          </div>
          <select
            id="autolock-select"
            value={autoLockTime}
            onChange={(e) => handleAutoLock(Number(e.target.value))}
            className="rounded-xl border border-white/[0.07] bg-black/40 px-3 py-2 text-[13px] text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer shrink-0"
          >
            {lockOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200 ${FOCUS_RING}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('onboarding.back')}
        </button>
        <button
          onClick={onFinish}
          className="flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          {t('onboarding.finish')}
          <Check className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function StepNav({ onNext, onBack, nextDisabled = false }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200 ${FOCUS_RING}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('onboarding.back')}
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
          nextDisabled
            ? 'bg-white/[0.05] text-zinc-500 cursor-not-allowed'
            : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:bg-emerald-400'
        }`}
      >
        {t('onboarding.continue')}
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function Onboarding({ onComplete }) {
  const [autofillMethod, setAutofillMethod] = useState(null)

  const STEPS_BASE = ['welcome', 'lang', 'theme', 'spotlight', 'autofill', 'hint', 'system']
  const STEPS_WITH_EXT = ['welcome', 'lang', 'theme', 'spotlight', 'autofill', 'extension', 'hint', 'system']

  const steps = autofillMethod === 'extension' ? STEPS_WITH_EXT : STEPS_BASE
  const totalSteps = steps.length
  const [stepIndex, setStepIndex] = useState(0)

  const currentStep = steps[stepIndex]

  const next = useCallback(() => setStepIndex((i) => Math.min(i + 1, totalSteps - 1)), [totalSteps])
  const back = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), [])

  const handleAutofillSelect = (method) => {
    setAutofillMethod(method)
  }

  const visibleDotSteps = steps.filter((s) => s !== 'welcome')
  const dotIndex = visibleDotSteps.indexOf(currentStep)

  return (
    <div className="fixed inset-0 overflow-hidden bg-(--app-bg) flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg mx-4">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shadow-2xl shadow-black/60 overflow-hidden">
          {currentStep !== 'welcome' && (
            <div className="flex items-center justify-between px-8 pt-7 pb-0">
              <ProgressDots total={visibleDotSteps.length} current={dotIndex} />
              <span className="text-[11px] font-medium tabular-nums text-zinc-600">
                {dotIndex + 1} / {visibleDotSteps.length}
              </span>
            </div>
          )}

          <div className="px-8 py-8">
            {currentStep === 'welcome' && (
              <StepWrapper visible>
                <StepWelcome onNext={next} />
              </StepWrapper>
            )}
            {currentStep === 'lang' && (
              <StepWrapper visible>
                <StepLanguage onNext={next} onBack={back} />
              </StepWrapper>
            )}
            {currentStep === 'theme' && (
              <StepWrapper visible>
                <StepTheme onNext={next} onBack={back} />
              </StepWrapper>
            )}
            {currentStep === 'spotlight' && (
              <StepWrapper visible>
                <StepSpotlight onNext={next} onBack={back} />
              </StepWrapper>
            )}
            {currentStep === 'autofill' && (
              <StepWrapper visible>
                <StepAutofill
                  onNext={next}
                  onBack={back}
                  onSelectMethod={handleAutofillSelect}
                />
              </StepWrapper>
            )}
            {currentStep === 'extension' && (
              <StepWrapper visible>
                <StepExtensionTuto onNext={next} onBack={back} />
              </StepWrapper>
            )}
            {currentStep === 'hint' && (
              <StepWrapper visible>
                <StepHint onNext={next} onBack={back} />
              </StepWrapper>
            )}
            {currentStep === 'system' && (
              <StepWrapper visible>
                <StepSystem onFinish={onComplete} onBack={back} />
              </StepWrapper>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
