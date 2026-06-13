import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from './store/useAuthStore'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Onboarding from './components/Onboarding'
import BackgroundWarningModal from './components/BackgroundWarningModal'
import UpdateNotification from './components/UpdateNotification'
import PatchNotesModal from './components/PatchNotesModal'
import { getNotesSince, PATCH_NOTES } from './data/patchnotes'
import rootpassMark from './assets/rootpass-mark.svg'

function App() {
  const { t } = useTranslation()
  const [backgroundWarning, setBackgroundWarning] = useState(null)
  const [onboardingDone, setOnboardingDone] = useState(null)
  const [patchNotes, setPatchNotes] = useState([])
  const isUnlocked = useAuthStore((state) => state.isUnlocked)
  const isInitialized = useAuthStore((state) => state.isVaultInitialized)
  const setVaultInitialized = useAuthStore((state) => state.setVaultInitialized)
  const lock = useAuthStore((state) => state.lock)

  const handleLogout = async () => {
    try {
      await window.api.lockVault()
    } catch (err) {
      console.error('lockVault failed:', err)
    }
    lock()
  }

  useEffect(() => {
    const cleanup = window.api.onBackgroundWarning?.((data) => setBackgroundWarning(data))
    return cleanup
  }, [])

  useEffect(() => {
    if (!isUnlocked) return
    window.api.getOnboardingDone().then((done) => setOnboardingDone(done))
  }, [isUnlocked])

  useEffect(() => {
    if (!isUnlocked || onboardingDone !== true) return
    let cancelled = false
    ;(async () => {
      try {
        const [current, lastSeen] = await Promise.all([
          window.api.getAppVersion(),
          window.api.getPatchNotesLastSeen()
        ])
        const notes = getNotesSince(lastSeen, current)
        if (!cancelled && notes.length) setPatchNotes(notes)
      } catch (err) {
        console.error('Lecture patchnotes échouée:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isUnlocked, onboardingDone])

  useEffect(() => {
    const onReopen = (e) => {
      const version = e?.detail?.version
      const match = version && PATCH_NOTES.find((n) => n.version === version)
      setPatchNotes(match ? [match] : PATCH_NOTES.slice(0, 1))
    }
    window.addEventListener('rootpass:show-patchnotes', onReopen)
    return () => window.removeEventListener('rootpass:show-patchnotes', onReopen)
  }, [])

  const handleClosePatchNotes = async () => {
    try {
      const current = await window.api.getAppVersion()
      await window.api.markPatchNotesSeen(current)
    } catch (err) {
      console.error('Marquage patchnotes échoué:', err)
    }
    setPatchNotes([])
  }

  if (isInitialized === null) {
    return (
      <div className="min-h-screen bg-(--app-bg) flex flex-col items-center justify-center gap-8">
        <img src={rootpassMark} alt="RootPass" className="size-14 opacity-80" />
        <div className="flex flex-col items-center gap-3">
          <p className="text-zinc-600 font-medium tracking-widest uppercase text-xs">
            {t('auth.loading')}
          </p>
          <div className="relative w-44 h-px bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 w-1/3 bg-emerald-400 rounded-full"
              style={{ animation: 'loading-slide 1.4s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    )
  }

  const warningModal = backgroundWarning ? (
    <BackgroundWarningModal
      shortcut={backgroundWarning.shortcut}
      onOk={(checkboxChecked) => {
        window.api.respondBackgroundWarning({ checkboxChecked })
        setBackgroundWarning(null)
      }}
    />
  ) : null

  if (isUnlocked) {
    if (onboardingDone === null) {
      return (
        <div className="min-h-screen bg-[#08080A] flex flex-col items-center justify-center gap-8">
          <img src={rootpassMark} alt="RootPass" className="size-14 opacity-80" />
          <div className="flex flex-col items-center gap-3">
            <p className="text-zinc-600 font-medium tracking-widest uppercase text-xs">
              {t('auth.loading')}
            </p>
            <div className="relative w-44 h-px bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 w-1/3 bg-emerald-400 rounded-full"
                style={{ animation: 'loading-slide 1.4s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
      )
    }

    if (onboardingDone === false) {
      return (
        <>
          <Onboarding
            onComplete={async () => {
              await window.api.setOnboardingDone()
              setOnboardingDone(true)
            }}
          />
          {warningModal}
        </>
      )
    }

    return (
      <>
        <Dashboard onLogout={handleLogout} />
        {warningModal}
        <UpdateNotification />
        {patchNotes.length > 0 && (
          <PatchNotesModal notes={patchNotes} onClose={handleClosePatchNotes} />
        )}
      </>
    )
  }

  return (
    <>
      <Login isInitialized={isInitialized} onInitialize={() => setVaultInitialized(true)} />
      {warningModal}
      <UpdateNotification />
    </>
  )
}

export default App
