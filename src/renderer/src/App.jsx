import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from './store/useAuthStore'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import BackgroundWarningModal from './components/BackgroundWarningModal'
import UpdateNotification from './components/UpdateNotification'
import { Loader2 } from 'lucide-react'

function App() {
  const { t } = useTranslation()
  const [backgroundWarning, setBackgroundWarning] = useState(null)
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

  if (isInitialized === null) {
    return (
      <div className="min-h-screen bg-[#08080A] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-emerald-400 animate-spin" />
        <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">
          {t('auth.loading')}
        </p>
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
    return (
      <>
        <Dashboard onLogout={handleLogout} />
        {warningModal}
        <UpdateNotification />
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
