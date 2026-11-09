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
import BrandMark from './components/home/BrandMark'

function LoadingScreen({ label }) {
  return (
    <div className="flex min-h-screen bg-(--hd-bg) p-3 sm:p-5">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[28px] bg-(--hd-shell) shadow-(--hd-shadow-shell) lg:rounded-[36px]">
        <BrandMark className="size-14" />
        <div role="status" className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-(--hd-line) border-t-(--hd-accent)" />
          <p className="text-[13px] font-semibold text-(--hd-mute)">{label}</p>
        </div>
      </div>
    </div>
  )
}

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
      setPatchNotes(match ? [match] : PATCH_NOTES)
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
    return <LoadingScreen label={t('auth.loading')} />
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
      return <LoadingScreen label={t('auth.loading')} />
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
