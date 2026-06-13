import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/useAuthStore'
import { Lock, ArrowRight, KeyRound, Loader2, Sparkles, Eye, EyeOff, HelpCircle } from 'lucide-react'
import rootpassMark from '../assets/rootpass-mark.svg'

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
      unlock()
    } else {
      const next = failedAttempts + 1
      setFailedAttempts(next)
      setError(t('auth.invalidMasterPassword'))
      if (next >= 3 && hint === null) {
        const h = await window.api.getMasterHint?.()
        setHint(h ?? '')
      }
    }
    setPassword('')
    setIsSubmitting(false)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-(--app-bg) font-sans selection:bg-emerald-500/30">
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[32rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex flex-1 items-center justify-center">
      <div className="w-full max-w-md px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-9 flex flex-col items-center text-center">
          <div className="group relative mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-2xl shadow-black/50">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <img src={rootpassMark} className="relative z-10 size-10" alt="RootPass" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">RootPass</h1>
          <p className="text-sm font-medium text-zinc-500">
            {isInitialized ? t('auth.enterMasterPassword') : t('auth.createMasterPassword')}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <form onSubmit={isInitialized ? handleLogin : handleSetup} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                {t('auth.masterPasswordLabel')}
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="size-4 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-3 pl-11 pr-12 font-mono tracking-widest text-white placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition-colors hover:text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {!isInitialized && (
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="size-4 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmMasterPassword')}
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-3 pl-11 pr-12 font-mono tracking-widest text-white placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="ml-1 mt-1 text-sm font-medium text-red-400 animate-in slide-in-from-top-1"
                >
                  {error}
                </div>
              )}

              {isInitialized && failedAttempts >= 3 && hint !== null && !showHint && hint !== '' && (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors animate-in fade-in slide-in-from-top-1"
                >
                  <HelpCircle className="size-3.5" />
                  {t('auth.showHint')}
                </button>
              )}

              {isInitialized && showHint && hint && (
                <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/70 mb-1">
                    {t('auth.hintLabel')}
                  </p>
                  <p className="text-sm text-amber-300/80">{hint}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-500 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-(--app-bg)"
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {isInitialized ? t('auth.unlockVault') : t('auth.initializeVault')}
                  {isInitialized ? (
                    <ArrowRight className="size-5" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-zinc-600">
          <KeyRound className="size-3.5" />
          <span>{t('auth.encryptionNote')}</span>
        </div>
      </div>
      </div>

      <div className="relative z-10 pb-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-700">
        <span>RootPass v{__APP_VERSION__}</span>
        <span className="text-zinc-800">·</span>
        <span>&copy; {new Date().getFullYear()} xkddn</span>
      </div>
    </div>
  )
}

export default Login
