import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  MousePointerClick,
  Puzzle,
  RefreshCw,
  Copy,
  Rocket,
  Laptop,
  ExternalLink
} from 'lucide-react'
import { setTheme, getStoredTheme } from '../theme'
import BrandMark from './home/BrandMark'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

const CHROME_EXT_URL = 'https://chromewebstore.google.com/detail/rootpass/lichfiegmdcjfealbbgojnnbkjflojap'
const FIREFOX_EXT_URL = 'https://addons.mozilla.org/fr/firefox/addon/rootpass/'

function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-(--hd-accent)'
              : i < current
              ? 'w-2 h-2 bg-(--hd-accent)/40'
              : 'w-2 h-2 bg-(--hd-line)'
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
        checked ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
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
          ? 'border-(--hd-accent) bg-(--hd-accent-soft) shadow-lg'
          : 'border-(--hd-line) bg-(--hd-card) hover:bg-(--hd-shell) hover:border-(--hd-faint)'
      }`}
    >
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-(--hd-accent-soft) px-2 py-0.5 text-[13px] font-bold text-(--hd-accent)">
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-(--hd-accent) shadow-lg">
          <Check className="size-3 text-(--hd-on-accent)" aria-hidden="true" />
        </span>
      )}
      <div className={`flex size-10 items-center justify-center rounded-xl border transition-colors ${
        active ? 'border-(--hd-accent)/30 bg-(--hd-accent-soft)' : 'border-(--hd-line) bg-(--hd-shell)'
      }`}>
        <Icon className={`size-5 ${active ? 'text-(--hd-accent)' : 'text-(--hd-ink2)'}`} aria-hidden="true" />
      </div>
      <div>
        <p className={`text-[13px] font-semibold ${active ? 'text-(--hd-accent)' : 'text-(--hd-ink)'}`}>
          {label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-(--hd-mute)">{desc}</p>
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
      <BrandMark className="size-20" />

      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-(--hd-accent)">
          RootPass
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-(--hd-ink)">
          {t('onboarding.welcomeTitle')}
        </h1>
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-8 py-3.5 text-sm font-bold text-(--hd-on-accent) shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
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
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.langTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.langTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.langDesc')}</p>
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
      shell: 'bg-[#1a1a1d]',
      bar: 'bg-[#34343a]',
      card: 'bg-[#28282d]',
      line: 'bg-[#34343a]'
    },
    {
      id: 'light',
      icon: Sun,
      label: t('onboarding.themeLight'),
      desc: t('onboarding.themeLightDesc'),
      shell: 'bg-[#f3f3f5]',
      bar: 'bg-[#e1e1e6]',
      card: 'bg-[#ffffff]',
      line: 'bg-[#e1e1e6]'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.themeTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.themeTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.themeDesc')}</p>
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
                  ? 'border-(--hd-accent) bg-(--hd-accent-soft) shadow-lg'
                  : 'border-(--hd-line) bg-(--hd-card) hover:bg-(--hd-shell)'
              }`}
            >
              {active && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-(--hd-accent) shadow-lg">
                  <Check className="size-3 text-(--hd-on-accent)" aria-hidden="true" />
                </span>
              )}
              <div
                className={`flex h-20 flex-col gap-2 overflow-hidden rounded-xl border border-(--hd-line) p-3 ${shell}`}
                aria-hidden="true"
              >
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-(--hd-accent)" />
                  <span className={`h-2 w-10 rounded-full ${bar}`} />
                </div>
                <div className={`flex-1 rounded-lg p-2 ${card}`}>
                  <div className={`h-1.5 w-3/4 rounded-full ${line}`} />
                  <div className={`mt-1.5 h-1.5 w-1/2 rounded-full ${line}`} />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon className={`size-4 shrink-0 ${active ? 'text-(--hd-accent)' : 'text-(--hd-mute)'}`} aria-hidden="true" />
                <div>
                  <p
                    className={`flex items-center gap-2 text-[13px] font-semibold ${active ? 'text-(--hd-accent)' : 'text-(--hd-ink)'}`}
                  >
                    {label}
                    {id === 'dark' && (
                      <span className="rounded-full bg-(--hd-good-soft) px-2 py-0.5 text-[12px] font-bold text-(--hd-good)">
                        {t('onboarding.themeRecommended')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-(--hd-mute)">{desc}</p>
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
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    window.api.getShortcut?.().then((s) => s && setShortcut(s))
    window.api.getSpotlightEnabled?.().then((v) => typeof v === 'boolean' && setEnabled(v))
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

  const handleToggle = async (next) => {
    setEnabled(next)
    if (!next) setIsRecording(false)
    const saved = await window.api.setSpotlightEnabled?.(next)
    if (typeof saved === 'boolean') setEnabled(saved)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.spotlightTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.spotlightTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.spotlightDesc')}</p>
      </div>

      <div className="space-y-5 rounded-3xl bg-(--hd-shell) p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor="spotlight-toggle" className="text-[15px] font-bold text-(--hd-ink)">
              {t('settings.spotlightEnableTitle')}
            </label>
            <p className="mt-1 text-[13px] leading-snug text-(--hd-mute)">
              {t('settings.spotlightEnableDesc')}
            </p>
          </div>
          <Toggle id="spotlight-toggle" checked={enabled} onChange={handleToggle} />
        </div>

        {enabled && (
          <div className="space-y-3 border-t border-(--hd-line) pt-5">
            <label className="block text-[13px] font-bold text-(--hd-ink2)" htmlFor="shortcut-display">
              {t('settings.spotlightShortcut')}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div
                id="shortcut-display"
                className={`flex-1 rounded-full px-5 py-3 font-mono text-sm transition-colors ${
                  isRecording
                    ? 'bg-(--hd-accent-soft) text-(--hd-accent)'
                    : 'bg-(--hd-card) text-(--hd-ink2)'
                }`}
              >
                {isRecording ? t('settings.pressCombo') : shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setIsRecording(true)
                }}
                disabled={isRecording}
                className="hd-pill hd-pill-soft min-h-11 bg-(--hd-card) px-5 disabled:opacity-50"
              >
                {isRecording ? t('settings.recording') : t('common.edit')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError(null)
                  try {
                    const ok = await window.api.testSpotlight?.()
                    if (ok === false) setError(t('settings.spotlightTestFail'))
                  } catch {
                    setError(t('settings.spotlightTestFail'))
                  }
                }}
                className="hd-pill hd-pill-tint min-h-11 px-5"
              >
                {t('settings.spotlightTest')}
              </button>
            </div>
            {isRecording && (
              <p className="text-xs text-(--hd-mute)">{t('settings.escToCancel')}</p>
            )}
            {error && <p className="text-xs text-(--hd-bad)">{error}</p>}
          </div>
        )}
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
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.autofillTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.autofillTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.autofillDesc')}</p>
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

function StepAutofillShortcut({ onNext, onBack }) {
  const { t } = useTranslation()
  const [shortcut, setShortcut] = useState('CommandOrControl+Shift+V')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.api.getAutofillStatus?.().then((s) => s?.shortcut && setShortcut(s.shortcut))
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const handleKeyDown = async (e) => {
      e.preventDefault()
      if (e.key === 'Escape') { setIsRecording(false); return }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      if (!e.ctrlKey && !e.metaKey && !e.altKey) { setError(t('settings.comboError')); return }
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      const newShortcut = keys.join('+')
      setIsRecording(false)
      const res = await window.api.setAutofillShortcut?.(newShortcut)
      if (res?.error === 'conflict') {
        setError(t('settings.autofillConflict'))
      } else {
        setShortcut(res?.shortcut ?? newShortcut)
        setError(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, t])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.autofillShortcutStep')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.autofillShortcutStep')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.autofillShortcutDesc')}</p>
      </div>

      <div className="rounded-2xl border border-(--hd-line) bg-(--hd-card) p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell)">
            <MousePointerClick className="size-4 text-(--hd-accent)" aria-hidden="true" />
          </div>
          <label className="text-[13px] font-semibold text-(--hd-ink)" htmlFor="autofill-shortcut-display">
            {t('settings.autofillShortcut')}
          </label>
        </div>

        <div className="flex items-center gap-3">
          <div
            id="autofill-shortcut-display"
            className={`flex-1 rounded-xl border px-4 py-3 font-mono text-sm transition-colors ${
              isRecording
                ? 'border-(--hd-accent) bg-(--hd-accent-soft) text-(--hd-accent)'
                : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2)'
            }`}
          >
            {isRecording ? t('settings.pressCombo') : shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
          </div>
          <button
            onClick={() => { setError(null); setIsRecording(true) }}
            disabled={isRecording}
            className={`rounded-full px-4 py-3 text-[13px] font-medium transition-all ${FOCUS_RING} ${
              isRecording
                ? 'bg-(--hd-line) text-(--hd-mute) cursor-not-allowed'
                : 'bg-(--hd-shell) text-(--hd-ink2) hover:bg-(--hd-line) hover:text-(--hd-ink) border border-(--hd-line)'
            }`}
          >
            {isRecording ? t('settings.recording') : t('common.edit')}
          </button>
          {isRecording && (
            <span className="text-xs text-(--hd-mute) animate-pulse">{t('settings.escToCancel')}</span>
          )}
        </div>
        {error && <p className="text-xs text-(--hd-bad)">{error}</p>}
      </div>

      <StepNav onNext={onNext} onBack={onBack} />
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
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.extTutoTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.extTutoTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.extTutoDesc')}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
            1
          </span>
          <div className="space-y-2 flex-1">
            <p className="text-[13px] text-(--hd-ink2) leading-relaxed">{steps[0]}</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => window.open(CHROME_EXT_URL, '_blank')}
                className={`flex items-center gap-2 rounded-full border border-(--hd-line) bg-(--hd-shell) px-3 py-2 text-[12px] font-medium text-(--hd-ink2) transition-all hover:border-(--hd-faint) hover:bg-(--hd-line) hover:text-(--hd-ink) ${FOCUS_RING}`}
              >
                <ExternalLink className="size-3 text-(--hd-mute)" aria-hidden="true" />
                Chrome / Edge / Brave
              </button>
              <button
                type="button"
                onClick={() => window.open(FIREFOX_EXT_URL, '_blank')}
                className={`flex items-center gap-2 rounded-full border border-(--hd-line) bg-(--hd-shell) px-3 py-2 text-[12px] font-medium text-(--hd-ink2) transition-all hover:border-(--hd-faint) hover:bg-(--hd-line) hover:text-(--hd-ink) ${FOCUS_RING}`}
              >
                <ExternalLink className="size-3 text-(--hd-mute)" aria-hidden="true" />
                Firefox
              </button>
            </div>
          </div>
        </div>
        {steps.slice(1).map((step, i) => (
          <div key={i + 1} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
              {i + 2}
            </span>
            <p className="text-[13px] text-(--hd-ink2) leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      {paired ? (
        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-5 py-4 animate-in zoom-in duration-200"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-(--hd-accent)">
            <Check className="size-4 text-(--hd-on-accent)" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-(--hd-accent)">{t('onboarding.extPaired')}</p>
            <p className="text-xs text-(--hd-accent)">{t('onboarding.extPairedDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-[13px] font-semibold text-(--hd-ink2)">{t('onboarding.extCodeLabel')}</p>
            {code && remaining > 0 && (
              <span className="font-mono text-[12px] tabular-nums text-(--hd-mute)">
                {t('onboarding.extCodeExpires', { seconds: remaining })}
              </span>
            )}
            {(!code || remaining <= 0) && (
              <span className="text-[12px] text-(--hd-bad)">{t('onboarding.extCodeExpired')}</span>
            )}
          </div>

          {code && remaining > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-[1_1_14rem] gap-1.5 sm:gap-2">
                {code.split('').map((d, i) => (
                  <span
                    key={i}
                    className="flex h-10 min-w-0 max-w-11 flex-1 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-card) font-mono text-lg font-bold tabular-nums text-(--hd-ink)"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={handleCopy}
                  aria-label={t('totp.copyCode')}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent) transition-colors hover:bg-(--hd-accent)/20 ${FOCUS_RING}`}
                >
                  {copied ? <Check className="size-3.5 text-(--hd-accent)" /> : <Copy className="size-3.5" />}
                </button>
                <button
                  onClick={fetchCode}
                  className={`flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-(--hd-line) bg-(--hd-card) px-4 text-[12px] font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-line) ${FOCUS_RING}`}
                >
                  <RefreshCw className="size-3 shrink-0" />
                  {t('onboarding.extNewCode')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={fetchCode}
              className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2.5 text-sm font-bold text-(--hd-on-accent) transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
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
          className={`flex items-center gap-1.5 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-2.5 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-shell) hover:text-(--hd-ink) ${FOCUS_RING}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('onboarding.back')}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onNext}
            className={`flex items-center gap-1.5 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-2.5 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-shell) hover:text-(--hd-ink) ${FOCUS_RING}`}
          >
            {t('onboarding.later')}
          </button>
          <button
            onClick={onNext}
            disabled={!paired}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
              paired
                ? 'bg-(--hd-accent) text-(--hd-on-accent) shadow-lg hover:-translate-y-0.5 hover:brightness-110'
                : 'bg-(--hd-shell) text-(--hd-mute) cursor-not-allowed'
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
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.hintStep')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.hintTitle')}</h2>
        <p className="mt-2 text-sm text-(--hd-mute)">{t('onboarding.hintDesc')}</p>
      </div>

      <div className="space-y-2">
        <label className="ml-1 block text-[13px] font-semibold text-(--hd-mute)">
          {t('onboarding.hintLabel')}
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value.slice(0, 120))}
          placeholder={t('onboarding.hintPlaceholder')}
          rows={3}
          className="w-full rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-4 py-3 text-sm text-(--hd-ink) placeholder:text-(--hd-mute) resize-none transition-all focus:border-(--hd-accent) focus:outline-none focus:ring-2 focus:ring-(--hd-accent)/30"
        />
        <p className="ml-1 text-[12px] text-(--hd-mute) tabular-nums">{hint.length}/120</p>
      </div>

      <div className="rounded-xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-4 py-3">
        <p className="text-xs text-(--hd-warn)">{t('onboarding.hintWarning')}</p>
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
        <p className="text-[13px] font-semibold text-(--hd-accent) mb-3">
          {t('onboarding.sysTitle')}
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--hd-ink)">{t('onboarding.sysTitle')}</h2>
      </div>

      <div className="rounded-2xl border border-(--hd-line) bg-(--hd-card) divide-y divide-(--hd-line)">
        <div className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell)">
              <Rocket className="size-4 text-(--hd-accent)" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="toggle-autostart"
                className="block text-[13px] font-semibold text-(--hd-ink) cursor-pointer"
              >
                {t('onboarding.autostartLabel')}
              </label>
              <p className="text-xs text-(--hd-mute) truncate">{t('onboarding.autostartDesc')}</p>
            </div>
          </div>
          <Toggle id="toggle-autostart" checked={autoStart} onChange={handleAutoStart} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell)">
              <Laptop className="size-4 text-(--hd-accent)" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <label htmlFor="autolock-select" className="block text-[13px] font-semibold text-(--hd-ink)">
                {t('onboarding.autolockLabel')}
              </label>
              <p className="text-xs text-(--hd-mute)">{t('onboarding.autolockDesc')}</p>
            </div>
          </div>
          <select
            id="autolock-select"
            value={autoLockTime}
            onChange={(e) => handleAutoLock(Number(e.target.value))}
            className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-3 py-2 text-[13px] text-(--hd-ink) outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) cursor-pointer shrink-0"
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
          className={`flex items-center gap-1.5 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-2.5 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-shell) hover:text-(--hd-ink) ${FOCUS_RING}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('onboarding.back')}
        </button>
        <button
          onClick={onFinish}
          className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-8 py-3 text-sm font-bold text-(--hd-on-accent) shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
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
          className={`flex items-center gap-1.5 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-2.5 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-shell) hover:text-(--hd-ink) ${FOCUS_RING}`}
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
        className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
          nextDisabled
            ? 'bg-(--hd-shell) text-(--hd-mute) cursor-not-allowed'
            : 'bg-(--hd-accent) text-(--hd-on-accent) shadow-lg hover:-translate-y-0.5 hover:brightness-110'
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
  const STEPS_WITH_SHORTCUT = [
    'welcome',
    'lang',
    'theme',
    'spotlight',
    'autofill',
    'autofillShortcut',
    'hint',
    'system'
  ]

  const steps =
    autofillMethod === 'extension'
      ? STEPS_WITH_EXT
      : autofillMethod === 'shortcut'
        ? STEPS_WITH_SHORTCUT
        : STEPS_BASE
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
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-(--hd-bg) p-4 font-sans sm:p-8">
      <div className="relative w-full max-w-xl">
        <div className="overflow-hidden rounded-[32px] bg-(--hd-card) shadow-(--hd-shadow-shell)">
          {currentStep !== 'welcome' && (
            <div className="flex items-center justify-between px-10 pt-9 pb-0">
              <ProgressDots total={visibleDotSteps.length} current={dotIndex} />
              <span className="text-[12px] font-medium tabular-nums text-(--hd-mute)">
                {dotIndex + 1} / {visibleDotSteps.length}
              </span>
            </div>
          )}

          <div className="px-10 py-10">
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
            {currentStep === 'autofillShortcut' && (
              <StepWrapper visible>
                <StepAutofillShortcut onNext={next} onBack={back} />
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
