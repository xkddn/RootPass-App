import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/useAuthStore'
import { ArrowRight, HelpCircle, Loader2, Lock, TriangleAlert } from 'lucide-react'
import BrandMark from './home/BrandMark'
import PasswordStrengthBar from './PasswordStrengthBar'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const fieldClass =
  'h-14 w-full rounded-full bg-(--hd-card) px-6 font-mono text-[16px] text-(--hd-ink) shadow-(--hd-shadow-card) outline-none ring-1 ring-(--hd-line) transition-shadow placeholder:font-sans placeholder:text-(--hd-mute) focus:ring-2 focus:ring-(--hd-accent) aria-[invalid=true]:ring-(--hd-bad)'

/** @param {{ isInitialized: boolean, onInitialize: () => void }} props */
function Login({ isInitialized, onInitialize }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [hint, setHint] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const passwordRef = useRef(null)

  const unlock = useAuthStore((state) => state.unlock)

  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setIsSubmitting(true)
    try {
      await window.api.setupMasterPassword(password)
      onInitialize()
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('setupMasterPassword failed:', err)
      setError(t('auth.setupError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const success = await window.api.verifyMasterPassword(password)
    if (success) {
      setPassword('')
      if (prefersReducedMotion()) {
        unlock()
        return
      }
      setLeaving(true)
      setTimeout(unlock, 220)
      return
    }
    const next = failedAttempts + 1
    setFailedAttempts(next)
    setError(t('auth.invalidMasterPassword'))
    if (next >= 3 && hint === null) {
      const h = await window.api.getMasterHint?.()
      setHint(h ?? '')
    }
    setPassword('')
    setIsSubmitting(false)
    passwordRef.current?.focus()
  }

  const title = isInitialized ? t('auth.openTitle') : t('auth.createTitle')
  const subtitle = isInitialized ? t('auth.openSubtitle') : t('auth.createSubtitle')
  const busy = isSubmitting || leaving

  return (
    <div
      className={`flex min-h-screen bg-(--hd-bg) p-3 font-sans text-(--hd-ink) transition-opacity duration-200 sm:p-5 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-(--hd-shell) shadow-(--hd-shadow-shell) lg:rounded-[36px]">
        <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <div className="flex items-center gap-3">
            <BrandMark className="size-8 shrink-0" />
            <span className="text-[18px] font-extrabold tracking-tight">RootPass</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-(--hd-card) px-3.5 py-2 text-[13px] font-semibold text-(--hd-ink2) shadow-(--hd-shadow-card)">
            <Lock className="size-3.5" aria-hidden="true" />
            {t('auth.locked')}
          </span>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px]">
            <h1 className="text-center text-[36px] font-extrabold leading-tight tracking-tight text-(--hd-ink) sm:text-[40px]">
              {title}
            </h1>
            {!isInitialized && (
              <p className="mt-3 text-center text-[16px] leading-snug text-(--hd-mute)">
                {subtitle}
              </p>
            )}

            <form
              onSubmit={isInitialized ? handleLogin : handleSetup}
              className="mt-10 space-y-6"
              noValidate
            >
              <div className="space-y-3">
                <label
                  htmlFor="master-password"
                  className="block text-[14px] font-bold text-(--hd-ink2)"
                >
                  {t('auth.masterPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="master-password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete={isInitialized ? 'current-password' : 'new-password'}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'login-error' : undefined}
                    required
                    autoFocus
                    disabled={leaving}
                    className={`${fieldClass} pr-28`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute inset-y-2 right-2 rounded-full px-4 text-[13px] font-bold text-(--hd-ink2) transition-colors hover:bg-(--hd-shell) hover:text-(--hd-ink)"
                  >
                    {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  </button>
                </div>

                {!isInitialized && <PasswordStrengthBar password={password} />}
              </div>

              {!isInitialized && (
                <div className="space-y-3">
                  <label
                    htmlFor="master-password-confirm"
                    className="block text-[14px] font-bold text-(--hd-ink2)"
                  >
                    {t('auth.confirmMasterPassword')}
                  </label>
                  <input
                    id="master-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className={fieldClass}
                  />
                </div>
              )}

              {error && (
                <div
                  key={failedAttempts}
                  id="login-error"
                  role="alert"
                  className="hd-rise flex items-start gap-3 rounded-2xl bg-(--hd-bad-soft) px-4 py-3.5 text-[14px] font-semibold text-(--hd-bad)"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!password || busy}
                className="hd-pill hd-pill-accent h-14 w-full text-[16px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    {isInitialized ? t('auth.opening') : t('auth.creating')}
                  </>
                ) : (
                  <>
                    {isInitialized ? t('auth.open') : t('auth.createBtn')}
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {isInitialized && failedAttempts >= 3 && hint !== null && hint !== '' && !showHint && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="hd-pill hd-pill-soft"
                >
                  <HelpCircle className="size-4" aria-hidden="true" />
                  {t('auth.showHint')}
                </button>
              </div>
            )}

            {isInitialized && showHint && hint && (
              <div className="hd-rise mt-6 rounded-2xl bg-(--hd-card) px-5 py-4 shadow-(--hd-shadow-card)">
                <p className="hd-label mb-1">{t('auth.hintLabel')}</p>
                <p className="text-[16px] font-semibold text-(--hd-ink)">{hint}</p>
              </div>
            )}
          </div>
        </main>

        <footer className="px-6 pb-7 text-center text-[13px] text-(--hd-mute)">
          RootPass v{__APP_VERSION__} &middot; &copy; {new Date().getFullYear()} xkddn
        </footer>
      </div>
    </div>
  )
}

export default Login
