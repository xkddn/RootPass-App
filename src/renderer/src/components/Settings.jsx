import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  CheckCircle2,
  XCircle,
  Globe,
  ChevronDown,
  Check,
  Keyboard,
  Laptop,
  RefreshCw,
  FolderOpen,
  AlertTriangle,
  Cloud,
  RotateCcw,
  Usb,
  FileJson,
  ShieldCheck,
  Smartphone,
  Wand2,
  MousePointerClick,
  Globe2,
  Palette,
  Sun,
  Moon,
  Puzzle,
  Link2,
  Unlink,
  Copy,
  RotateCw,
  KeyRound,
  Save,
  ScrollText,
  Info,
  ChevronRight,
  ExternalLink,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { getStoredTheme, setTheme } from '../theme'
import { PATCH_NOTES } from '../data/patchnotes'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

const CHROME_EXT_URL =
  'https://chromewebstore.google.com/detail/rootpass/lichfiegmdcjfealbbgojnnbkjflojap'
const FIREFOX_EXT_URL = 'https://addons.mozilla.org/fr/firefox/addon/rootpass/'

const LANGUAGES = [
  { code: 'fr', label: 'Français', flagClass: 'fi fi-fr' },
  { code: 'en', label: 'English', flagClass: 'fi fi-gb' }
]

function LanguageSelect({ value, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKey = (e) => {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-56" onKeyDown={handleKey}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('settings.langAria', { label: current.label })}
        className={`flex w-full items-center justify-between gap-3 rounded-full border border-(--hd-line) bg-(--hd-shell) px-4 py-3 text-[13px] text-(--hd-ink) transition-all hover:border-(--hd-faint) hover:bg-(--hd-line) ${FOCUS_RING}`}
      >
        <span className="flex items-center gap-2.5">
          <span className={`${current.flagClass} rounded-sm`} aria-hidden="true" />
          <span>{current.label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-(--hd-mute) transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('settings.chooseLang')}
          className="absolute top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-(--hd-line) bg-(--hd-card) py-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {LANGUAGES.map(({ code, flagClass, label }) => {
            const isSelected = value === code
            return (
              <button
                key={code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  onChange(code)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-(--hd-shell) ${FOCUS_RING} ${
                  isSelected ? 'text-(--hd-accent)' : 'text-(--hd-ink2)'
                }`}
              >
                <span className={`${flagClass} rounded-sm`} aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-(--hd-accent)" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConflictResolver({ conflicts, onResolved }) {
  const { t } = useTranslation()
  const [resolving, setResolving] = useState(false)
  const [done, setDone] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    await window.api.resolveVaultConflicts()
    setDone(true)
    setResolving(false)
    setTimeout(() => {
      setDone(false)
      onResolved()
    }, 2000)
  }

  const handleOpenFolder = () => window.api.openVaultFolder()

  if (done) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-5 py-4 animate-in zoom-in duration-200">
        <CheckCircle2 className="size-5 shrink-0 text-(--hd-accent)" />
        <p className="text-sm text-(--hd-accent)">{t('sync.conflictsCleaned')}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-(--hd-bad)/30 bg-(--hd-bad-soft) px-5 py-4 animate-in zoom-in duration-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-(--hd-bad) mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-(--hd-bad)">
            {t('sync.conflictsDetected', { count: conflicts.length })}
          </p>
          <p className="mt-1 text-xs text-(--hd-bad) leading-relaxed">{t('sync.conflictsDesc')}</p>

          <ul className="mt-3 space-y-1">
            {conflicts.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <XCircle className="size-3.5 shrink-0 text-(--hd-bad)" />
                <span className="font-mono text-[12px] text-(--hd-bad) truncate">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-2 rounded-full bg-(--hd-bad) px-4 py-2 text-xs font-bold text-(--hd-card) transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-(--hd-bad)"
            >
              {resolving ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {t('sync.keepAndDelete')}
            </button>

            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-2 rounded-full border border-(--hd-bad)/30 bg-(--hd-bad-soft) px-4 py-2 text-xs font-medium text-(--hd-bad) transition-all hover:bg-(--hd-bad)/20 outline-none focus-visible:ring-2 focus-visible:ring-(--hd-bad)"
            >
              <FolderOpen className="size-3.5" />
              {t('sync.openFolderManually')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SYNC_METHODS = [
  {
    id: 'cloud',
    icon: Cloud,
    labelKey: 'sync.methodCloud',
    subKey: 'sync.methodCloudSub',
    badgeKey: 'sync.recommended',
    badgeColor: 'bg-(--hd-accent-soft) text-(--hd-accent)'
  },
  {
    id: 'usb',
    icon: Usb,
    labelKey: 'sync.methodUsb',
    subKey: 'sync.methodUsbSub',
    badgeKey: null
  },
  {
    id: 'enc',
    icon: ShieldCheck,
    labelKey: 'sync.methodEnc',
    subKey: 'sync.methodEncSub',
    badgeKey: null
  },
  {
    id: 'json',
    icon: FileJson,
    labelKey: 'sync.methodJson',
    subKey: 'sync.methodJsonSub',
    badgeKey: null
  }
]

function FolderSection({ status, syncOp, opMessage, onChangeFolder, onReset, badgeLabel }) {
  const { t } = useTranslation()
  const folderDisplay = status?.vaultFolder ?? '…'
  const isCustom = status?.isCustomPath ?? false

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-[13px] font-bold text-(--hd-ink2)">
          {t('sync.currentFolder')}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-(--hd-line) bg-(--hd-shell) px-4 py-3">
          <FolderOpen className="size-4 shrink-0 text-(--hd-mute)" />
          <span className="truncate font-mono text-[12px] text-(--hd-ink2)">{folderDisplay}</span>
          {isCustom && (
            <span className="ml-auto shrink-0 rounded-full bg-(--hd-accent-soft) px-2 py-0.5 text-[12px] font-semibold text-(--hd-accent)">
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onChangeFolder}
          disabled={syncOp === 'loading'}
          className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-3 text-sm font-bold text-(--hd-on-accent) shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
        >
          {syncOp === 'loading' ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <FolderOpen className="size-4" />
          )}
          {t('sync.changeFolder')}
        </button>

        {isCustom && (
          <button
            onClick={onReset}
            disabled={syncOp === 'loading'}
            className="flex items-center gap-2 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-3 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-line) hover:text-(--hd-ink) disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
          >
            <RotateCcw className="size-4" />
            {t('sync.resetLocal')}
          </button>
        )}
      </div>

      {syncOp === 'success' && (
        <div className="flex items-start gap-2 rounded-xl bg-(--hd-accent-soft) border border-(--hd-accent)/30 px-4 py-3 animate-in zoom-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
          <p className="text-sm text-(--hd-accent)">{opMessage}</p>
        </div>
      )}
      {syncOp === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-(--hd-bad-soft) border border-(--hd-bad)/30 px-4 py-3 animate-in zoom-in duration-200">
          <XCircle className="size-4 shrink-0 text-(--hd-bad) mt-0.5" />
          <p className="text-sm text-(--hd-bad)">{opMessage}</p>
        </div>
      )}
    </div>
  )
}

function SyncTab({ method }) {
  const { t } = useTranslation()
  const methodMeta = SYNC_METHODS.find((m) => m.id === method) || SYNC_METHODS[0]
  const [status, setStatus] = useState(null)
  const [syncOp, setSyncOp] = useState(null)
  const [opMessage, setOpMessage] = useState('')
  const [exportStatus, setExportStatus] = useState(null)

  const [pwModal, setPwModal] = useState(null)
  const [pwValue, setPwValue] = useState('')
  const [encOp, setEncOp] = useState(null)
  const [encMessage, setEncMessage] = useState('')
  const [encActionType, setEncActionType] = useState(null)

  const loadStatus = async () => {
    const s = await window.api.checkVaultStatus()
    setStatus(s)
  }

  useEffect(() => {
    loadStatus()
    const unsubPath = window.api.onVaultPathChanged(loadStatus)
    const unsubResume = window.api.onVaultResumed(loadStatus)
    return () => {
      unsubPath()
      unsubResume()
    }
  }, [])

  const showResult = (type, msg) => {
    setSyncOp(type)
    setOpMessage(msg)
    setTimeout(() => setSyncOp(null), 4000)
  }

  const handleChangeFolder = async () => {
    const folder = await window.api.selectVaultFolder()
    if (!folder) return
    setSyncOp('loading')
    const result = await window.api.setVaultPath(folder)
    if (result.success) {
      await loadStatus()
      if (result.wasExisting) {
        showResult(
          'success',
          result.otherHostWarning
            ? t('sync.switchedWarning', { host: result.otherHostWarning })
            : t('sync.synced')
        )
      } else {
        showResult('success', t('sync.copied'))
      }
    } else {
      showResult('error', t('sync.changeError'))
    }
  }

  const handleReset = async () => {
    setSyncOp('loading')
    await window.api.resetVaultPath()
    await loadStatus()
    showResult('success', t('sync.reset'))
  }

  const openEncModal = (action) => {
    setPwValue('')
    setEncOp(null)
    setEncActionType(action)
    setPwModal(action)
  }

  const handleEncConfirm = async () => {
    if (!pwValue.trim()) return
    const action = pwModal
    setPwModal(null)
    setEncActionType(action)
    setEncOp('loading')
    try {
      let result
      if (action === 'export') {
        result = await window.api.exportEncrypted(pwValue)
      } else {
        result = await window.api.importEncrypted(pwValue)
      }
      if (result?.canceled) {
        setEncOp(null)
        return
      }
      if (result?.error === 'wrong_password') {
        setEncOp('wrong_password')
        return
      }
      if (result?.error === 'invalid_file') {
        setEncOp('error')
        setEncMessage(t('sync.invalidFile'))
        setTimeout(() => setEncOp(null), 4000)
        return
      }
      if (result?.success) {
        setEncOp('success')
        setEncMessage(
          action === 'export'
            ? t('sync.exported')
            : t('sync.importedCount', { count: result.count })
        )
        setTimeout(() => setEncOp(null), 4000)
      }
    } catch {
      setEncOp('error')
      setEncMessage(t('common.genericError'))
      setTimeout(() => setEncOp(null), 4000)
    }
  }

  const handleExportJson = async () => {
    try {
      const success = await window.api.exportAccounts()
      setExportStatus(success ? 'success' : 'error')
      setTimeout(() => setExportStatus(null), 3000)
    } catch {
      setExportStatus('error')
      setTimeout(() => setExportStatus(null), 3000)
    }
  }

  const conflicts = status?.conflicts ?? []
  const otherHost = status?.otherHostWarning

  const MethodIcon = methodMeta.icon

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <MethodIcon className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t(methodMeta.labelKey)}</h3>
          <p className="mt-1 text-sm text-(--hd-mute)">{t(methodMeta.subKey)}</p>
        </div>
        {methodMeta.badgeKey && (
          <span
            className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${methodMeta.badgeColor}`}
          >
            {t(methodMeta.badgeKey)}
          </span>
        )}
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-4 py-3">
        <Info className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
        <p className="text-xs leading-relaxed text-(--hd-accent)">{t('sync.pickOneHint')}</p>
      </div>

      <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8  space-y-6">
        {method === 'cloud' && (
          <>
            <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('sync.cloudDesc')}</p>
            <FolderSection
              status={status}
              syncOp={syncOp}
              opMessage={opMessage}
              onChangeFolder={handleChangeFolder}
              onReset={handleReset}
              badgeLabel={t('sync.methodCloud')}
            />
            <div className="border-t border-(--hd-line) pt-5 space-y-3">
              <p className="text-[13px] font-semibold text-(--hd-mute)">
                {t('sync.howToConfigure')}
              </p>
              {t('sync.cloudSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-(--hd-mute)">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {method === 'usb' && (
          <>
            <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('sync.usbDesc')}</p>
            <FolderSection
              status={status}
              syncOp={syncOp}
              opMessage={opMessage}
              onChangeFolder={handleChangeFolder}
              onReset={handleReset}
              badgeLabel={t('sync.methodUsb')}
            />
            <div className="border-t border-(--hd-line) pt-5 space-y-3">
              <p className="text-[13px] font-semibold text-(--hd-mute)">
                {t('sync.howToUse')}
              </p>
              {t('sync.usbSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-(--hd-mute)">{step}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-(--hd-warn) mt-0.5" />
              <p className="text-xs text-(--hd-warn) leading-relaxed">{t('sync.usbWarning')}</p>
            </div>
          </>
        )}

        {method === 'enc' && (
          <>
            <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('sync.encDesc')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-4 space-y-2">
                <p className="text-[13px] font-bold text-(--hd-mute)">
                  {t('sync.vsCloudUsb')}
                </p>
                <p className="text-[12px] leading-relaxed text-(--hd-mute)">
                  {t('sync.vsCloudUsbDesc')}
                </p>
              </div>
              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-4 space-y-2">
                <p className="text-[13px] font-bold text-(--hd-mute)">
                  {t('sync.vsJson')}
                </p>
                <p className="text-[12px] leading-relaxed text-(--hd-mute)">{t('sync.vsJsonDesc')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-(--hd-ink)">
                    {t('sync.exportHeading')}
                  </p>
                  <p className="text-xs text-(--hd-mute) mt-0.5">{t('sync.encExportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEncModal('export')}
                    disabled={encOp === 'loading' && encActionType === 'export'}
                    className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2.5 text-sm font-bold text-(--hd-on-accent) shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
                  >
                    <ShieldCheck className="size-4" />
                    {t('sync.exportEncrypted')}
                  </button>
                  {encActionType === 'export' && encOp === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-accent) animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {encMessage}
                    </span>
                  )}
                  {encActionType === 'export' && encOp === 'wrong_password' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-bad) animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.wrongPassword')}
                    </span>
                  )}
                  {encActionType === 'export' && encOp === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-bad) animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {encMessage}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-(--hd-ink)">
                    {t('sync.importHeading')}
                  </p>
                  <p className="text-xs text-(--hd-mute) mt-0.5">{t('sync.encImportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEncModal('import')}
                    disabled={encOp === 'loading' && encActionType === 'import'}
                    className="flex items-center gap-2 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-2.5 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-line) hover:text-(--hd-ink) disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
                  >
                    <Download className="size-4" />
                    {t('sync.importEncrypted')}
                  </button>
                  {encActionType === 'import' && encOp === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-accent) animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {encMessage}
                    </span>
                  )}
                  {encActionType === 'import' && encOp === 'wrong_password' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-bad) animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.wrongPassword')}
                    </span>
                  )}
                  {encActionType === 'import' && encOp === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-bad) animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {encMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-(--hd-line) pt-5 space-y-3">
              <p className="text-[13px] font-semibold text-(--hd-mute)">
                {t('sync.howToMigrate')}
              </p>
              {t('sync.encSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-(--hd-mute)">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {method === 'json' && (
          <>
            <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('sync.jsonDesc')}</p>

            <div className="space-y-3">
              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-(--hd-ink)">
                    {t('sync.exportHeading')}
                  </p>
                  <p className="text-xs text-(--hd-mute) mt-0.5">{t('sync.jsonExportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2.5 text-sm font-bold text-(--hd-on-accent) shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)"
                  >
                    <Download className="size-4" />
                    {t('sync.exportJson')}
                  </button>
                  {exportStatus === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-accent) animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {t('sync.exportedShort')}
                    </span>
                  )}
                  {exportStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-(--hd-bad) animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.exportErrorShort')}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-2">
                <p className="text-[13px] font-semibold text-(--hd-ink)">{t('sync.importHeading')}</p>
                <p className="text-xs text-(--hd-mute) leading-relaxed">
                  {t('sync.jsonImportDescPrefix')}{' '}
                  <span className="font-semibold text-(--hd-ink2)">{t('sync.jsonImportLabel')}</span>{' '}
                  {t('sync.jsonImportDescSuffix')}
                </p>
              </div>
            </div>

            <div className="border-t border-(--hd-line) pt-5 space-y-3">
              <p className="text-[13px] font-semibold text-(--hd-mute)">
                {t('sync.steps')}
              </p>
              {t('sync.jsonSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-(--hd-mute)">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-(--hd-warn) mt-0.5" />
              <p className="text-xs text-(--hd-warn) leading-relaxed">
                {t('sync.jsonWarningPrefix')} <strong>{t('sync.jsonWarningBold')}</strong>
                {t('sync.jsonWarningSuffix')}
              </p>
            </div>
          </>
        )}
      </div>

      {method !== 'json' && otherHost && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-5 py-4 animate-in zoom-in duration-200">
          <AlertTriangle className="size-5 shrink-0 text-(--hd-warn) mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-(--hd-warn)">{t('sync.vaultMaybeOpen')}</p>
            <p className="mt-1 text-xs text-(--hd-warn)">
              {t('sync.vaultMaybeOpenDesc', { host: otherHost })}
            </p>
          </div>
        </div>
      )}

      {method !== 'json' && conflicts.length > 0 && (
        <ConflictResolver conflicts={conflicts} onResolved={loadStatus} />
      )}

      {pwModal && (
        <div
          className="rp-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-[#000]/60 backdrop-blur-sm"
          onClick={() => {
            setPwModal(null)
            setPwValue('')
          }}
        >
          <div
            className="rp-panel-in w-84 rounded-[28px] bg-(--hd-card) p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-(--hd-accent)/30 bg-(--hd-accent-soft)">
                <ShieldCheck className="size-4 text-(--hd-accent)" aria-hidden="true" />
              </div>
              <h4 className="text-[15px] font-bold text-(--hd-ink)">
                {pwModal === 'export' ? t('sync.pwModalTitleExport') : t('sync.pwModalTitleImport')}
              </h4>
            </div>
            <p className="mb-4 text-[12px] leading-relaxed text-(--hd-mute)">
              {pwModal === 'export' ? t('sync.pwModalDescExport') : t('sync.pwModalDescImport')}
            </p>
            <input
              type="password"
              autoFocus
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEncConfirm()}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-4 py-2.5 text-[13px] text-(--hd-ink) outline-none placeholder:text-(--hd-mute) focus:border-(--hd-accent) focus:ring-1 focus:ring-(--hd-accent)/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setPwModal(null)
                  setPwValue('')
                }}
                className="rounded-full px-4 py-2 text-[13px] text-(--hd-ink2) transition-colors hover:text-(--hd-ink)"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEncConfirm}
                disabled={!pwValue.trim()}
                className="rounded-full bg-(--hd-accent) px-4 py-2 text-[13px] font-bold text-(--hd-on-accent) transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtensionTab() {
  const { t } = useTranslation()
  const [status, setStatus] = useState({ paired: false, connected: false, enabled: true })
  const [code, setCode] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.api.getBridgeStatus?.().then((s) => s && setStatus(s))
    const unsub = window.api.onBridgeStatus?.((s) => {
      setStatus(s)
      if (s.paired) {
        setCode(null)
        setExpiresAt(null)
      }
    })
    return () => unsub?.()
  }, [])

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setCode(null)
        setExpiresAt(null)
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [expiresAt])

  const toggleEnabled = async () => {
    const next = !status.enabled
    const s = await window.api.setBridgeEnabled?.(next)
    if (s) setStatus(s)
    if (!next) {
      setCode(null)
      setExpiresAt(null)
      setConfirmRevoke(null)
    }
  }

  const toggleAutoSubmit = async () => {
    const s = await window.api.setBridgeAutoSubmit?.(!status.autoSubmit)
    if (s) setStatus(s)
  }

  const handleConnect = async () => {
    setConfirmRevoke(null)
    const res = await window.api.getBridgePairingCode?.()
    if (res?.code) {
      setCode(res.code)
      setExpiresAt(res.expiresAt)
    }
  }

  const handleRevoke = async (target) => {
    if (confirmRevoke !== target) {
      setConfirmRevoke(target)
      return
    }
    setConfirmRevoke(null)
    await window.api.revokeBridge?.(target === 'all' ? undefined : target)
    if (target === 'all') {
      setCode(null)
      setExpiresAt(null)
    }
  }

  const handleCopy = () => {
    if (!code) return
    window.api.copyToClipboard?.(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const state = status.connected ? 'connected' : status.paired ? 'paired' : 'offline'
  const STATE_META = {
    connected: {
      label: t('settings.extStatusConnected'),
      desc: t('settings.extStatusConnectedDesc'),
      dot: 'bg-(--hd-accent)',
      ring: 'bg-(--hd-accent)/60',
      pill: 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent)'
    },
    paired: {
      label: t('settings.extStatusPaired'),
      desc: t('settings.extStatusPairedDesc'),
      dot: 'bg-(--hd-warn)',
      ring: 'bg-(--hd-warn)/50',
      pill: 'border-(--hd-warn)/30 bg-(--hd-warn)/12 text-(--hd-warn)'
    },
    offline: {
      label: t('settings.extStatusOffline'),
      desc: t('settings.extStatusOfflineDesc'),
      dot: 'bg-(--hd-mute)',
      ring: 'bg-(--hd-line)',
      pill: 'border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2)'
    }
  }
  const meta = STATE_META[state]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <Puzzle className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.extTitle')}</h3>
      </div>

      <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8  space-y-6">
        <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('settings.extDesc')}</p>

        <div className="flex items-center justify-between border-t border-(--hd-line) pt-6">
          <div>
            <h4 className="text-[13px] font-semibold text-(--hd-ink)">
              {t('settings.extEnableTitle')}
            </h4>
            <p className="mt-1 text-xs text-(--hd-mute)">{t('settings.extEnableDesc')}</p>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
              status.enabled ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
                status.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {!status.enabled && (
          <div className="flex items-start gap-3 rounded-xl border border-(--hd-line) bg-(--hd-card) px-4 py-3">
            <Puzzle className="size-4 shrink-0 text-(--hd-mute) mt-0.5" />
            <p className="text-xs leading-relaxed text-(--hd-mute)">{t('settings.extDisabledNote')}</p>
          </div>
        )}

        {status.enabled && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${meta.ring} ${
                    state === 'connected' ? 'animate-ping' : ''
                  }`}
                />
                <span className={`relative inline-flex size-2.5 rounded-full ${meta.dot}`} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-(--hd-ink)">{meta.label}</p>
                <p className="mt-0.5 text-xs text-(--hd-mute)">{meta.desc}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold ${meta.pill}`}
            >
              {meta.label}
            </span>
          </div>
        )}

        {status.enabled && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-5 py-4">
            <div>
              <h4 className="text-[13px] font-semibold text-(--hd-ink)">
                {t('settings.extAutoSubmitTitle')}
              </h4>
              <p className="mt-1 text-xs text-(--hd-mute)">{t('settings.extAutoSubmitDesc')}</p>
            </div>
            <button
              onClick={toggleAutoSubmit}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
                status.autoSubmit ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
                  status.autoSubmit ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {status.enabled && status.pairings?.length > 0 && (
          <div className="space-y-3 border-t border-(--hd-line) pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-(--hd-mute)">
                {t('settings.extPairedBrowsers')}
              </p>
              {status.pairings.length > 1 && (
                <button
                  onClick={() => handleRevoke('all')}
                  onBlur={() => confirmRevoke === 'all' && setConfirmRevoke(null)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-(--hd-bad) ${
                    confirmRevoke === 'all'
                      ? 'border-(--hd-bad) bg-(--hd-bad-soft) text-(--hd-bad)'
                      : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-mute) hover:bg-(--hd-bad)/10 hover:text-(--hd-bad)'
                  }`}
                >
                  {confirmRevoke === 'all'
                    ? t('settings.extRevokeConfirm')
                    : t('settings.extRevokeAll')}
                </button>
              )}
            </div>
            {status.pairings.map((p) => (
              <div
                key={p.extId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell)">
                    <Globe2 className="size-4 text-(--hd-accent)" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-(--hd-ink)">{p.label}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${p.connected ? 'bg-(--hd-accent)' : 'bg-(--hd-faint)'}`}
                      />
                      <span className="text-[12px] text-(--hd-mute)">
                        {p.connected ? t('settings.extConnected') : t('settings.extOffline')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(p.extId)}
                  onBlur={() => confirmRevoke === p.extId && setConfirmRevoke(null)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-(--hd-bad) ${
                    confirmRevoke === p.extId
                      ? 'border-(--hd-bad) bg-(--hd-bad-soft) text-(--hd-bad)'
                      : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2) hover:bg-(--hd-bad)/10 hover:text-(--hd-bad)'
                  }`}
                >
                  <Unlink className="size-3.5" />
                  {confirmRevoke === p.extId
                    ? t('settings.extRevokeConfirm')
                    : t('settings.extRevoke')}
                </button>
              </div>
            ))}
          </div>
        )}

        {status.enabled &&
          (code ? (
            <div className="space-y-4 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-5 py-5 animate-in zoom-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-[13px] font-semibold text-(--hd-accent)">
                  {t('settings.extCodeTitle')}
                </p>
                <span className="font-mono text-[12px] tabular-nums text-(--hd-accent)">
                  {remaining > 0 ? t('settings.extCodeExpiresIn', { seconds: remaining }) : ''}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-(--hd-ink2)">{t('settings.extCodeDesc')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-[1_1_15rem] gap-1.5 sm:gap-2">
                  {code.split('').map((d, i) => (
                    <span
                      key={i}
                      className="flex h-11 min-w-0 max-w-12 flex-1 items-center justify-center rounded-xl border border-(--hd-line) bg-(--hd-shell) font-mono text-xl font-bold tabular-nums text-(--hd-ink)"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={handleCopy}
                    aria-label={t('totp.copyCode')}
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent) transition-colors hover:bg-(--hd-accent)/20 ${FOCUS_RING}`}
                  >
                    {copied ? (
                      <Check className="size-4 text-(--hd-accent)" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={handleConnect}
                    className={`flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-(--hd-line) bg-(--hd-shell) px-4 text-[13px] font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-line) hover:text-(--hd-ink) ${FOCUS_RING}`}
                  >
                    <RefreshCw className="size-3.5 shrink-0" />
                    {t('settings.extNewCode')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-t border-(--hd-line) pt-6">
              <button
                onClick={handleConnect}
                className={
                  status.paired
                    ? `flex items-center gap-2 rounded-full border border-(--hd-line) bg-(--hd-shell) px-5 py-3 text-sm font-medium text-(--hd-ink2) transition-all hover:bg-(--hd-line) hover:text-(--hd-on-accent) ${FOCUS_RING}`
                    : 'flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-3 text-sm font-bold text-(--hd-on-accent) shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'
                }
              >
                <Link2 className="size-4" />
                {status.paired ? t('settings.extConnectAnother') : t('settings.extConnect')}
              </button>
            </div>
          ))}

        <div className="border-t border-(--hd-line) pt-5 space-y-3">
          <p className="text-[13px] font-semibold text-(--hd-mute)">
            {t('settings.extHowTo')}
          </p>
          {t('settings.extSteps', { returnObjects: true }).map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-[13px] text-(--hd-mute)">{step}</p>
                {i === 0 && (
                  <div className="flex flex-wrap gap-2">
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
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-3">
            <Globe2 className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
            <p className="text-[12px] leading-relaxed text-(--hd-mute)">
              {t('settings.extSecurityLocal')}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-3">
            <ShieldCheck className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
            <p className="text-[12px] leading-relaxed text-(--hd-mute)">
              {t('settings.extSecurityKey')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HintTab() {
  const { t } = useTranslation()
  const [hint, setHint] = useState('')
  const [hintSaved, setHintSaved] = useState(false)

  useEffect(() => {
    window.api.getMasterHint?.().then((h) => setHint(h ?? ''))
  }, [])

  const handleSaveHint = async () => {
    await window.api.setMasterHint?.(hint)
    setHintSaved(true)
    setTimeout(() => setHintSaved(false), 4000)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <KeyRound className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('misc.hintTitle')}</h3>
      </div>

      <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
        <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('misc.hintDesc')}</p>

        <div className="mt-5 space-y-2">
          <label className="block text-[13px] font-bold text-(--hd-ink2)">
            {t('misc.hintLabel')}
          </label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value.slice(0, 120))}
            placeholder={t('misc.hintPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-4 py-3 text-sm text-(--hd-ink) placeholder:text-(--hd-mute) transition-all focus:border-(--hd-accent) focus:outline-none focus:ring-2 focus:ring-(--hd-accent)/30"
          />
          <p className="ml-1 text-[12px] tabular-nums text-(--hd-mute)">{hint.length}/120</p>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-(--hd-warn) mt-0.5" />
          <p className="text-xs leading-relaxed text-(--hd-warn)">{t('misc.hintWarning')}</p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSaveHint}
            disabled={hintSaved}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all ${FOCUS_RING} ${
              hintSaved
                ? 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent) cursor-default'
                : 'border-transparent bg-(--hd-accent) text-(--hd-on-accent) shadow-lg hover:-translate-y-0.5 hover:brightness-110'
            }`}
          >
            {hintSaved ? (
              <>
                <CheckCircle2 className="size-3.5 text-(--hd-accent)" aria-hidden="true" />
                {t('misc.hintSaved')}
              </>
            ) : (
              <>
                <Save className="size-3.5" aria-hidden="true" />
                {t('misc.hintSave')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function MasterPasswordTab() {
  const { t } = useTranslation()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  const reset = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!oldPassword || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setStatus('loading')
    try {
      const res = await window.api.changeMasterPassword(oldPassword, newPassword)
      if (res?.success) {
        setStatus('success')
        reset()
        setTimeout(() => setStatus(null), 4000)
      } else if (res?.error === 'wrong_password') {
        setStatus(null)
        setError(t('settings.masterPasswordWrong'))
      } else {
        setStatus(null)
        setError(t('common.genericError'))
      }
    } catch {
      setStatus(null)
      setError(t('common.genericError'))
    }
  }

  const inputType = showPasswords ? 'text' : 'password'
  const inputClass =
    'w-full rounded-xl border border-(--hd-line) bg-(--hd-shell) px-4 py-3 text-sm text-(--hd-ink) placeholder:text-(--hd-mute) transition-all focus:border-(--hd-accent) focus:outline-none focus:ring-2 focus:ring-(--hd-accent)/30'

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <Lock className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.masterPasswordTitle')}</h3>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8  space-y-5"
      >
        <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('settings.masterPasswordDesc')}</p>

        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-(--hd-ink2)">
            {t('settings.masterPasswordOld')}
          </label>
          <input
            type={inputType}
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-(--hd-ink2)">
            {t('settings.masterPasswordNew')}
          </label>
          <input
            type={inputType}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-(--hd-ink2)">
            {t('auth.confirmMasterPassword')}
          </label>
          <input
            type={inputType}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            className={inputClass}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className={`flex items-center gap-1.5 text-[12px] font-medium text-(--hd-mute) transition-colors hover:text-(--hd-ink2) ${FOCUS_RING}`}
        >
          {showPasswords ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {showPasswords ? t('auth.hidePassword') : t('auth.showPassword')}
        </button>

        {error && <p className="text-xs text-(--hd-bad)">{error}</p>}

        <div className="flex items-center gap-4 border-t border-(--hd-line) pt-5">
          <button
            type="submit"
            disabled={status === 'loading' || !oldPassword || !newPassword || !confirmPassword}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-all ${FOCUS_RING} ${
              status === 'loading' || !oldPassword || !newPassword || !confirmPassword
                ? 'cursor-not-allowed bg-(--hd-shell) text-(--hd-mute)'
                : 'bg-(--hd-accent) text-(--hd-on-accent) shadow-lg hover:-translate-y-0.5 hover:brightness-110'
            }`}
          >
            {status === 'loading' ? (
              <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Lock className="size-3.5" aria-hidden="true" />
            )}
            {t('settings.masterPasswordSubmit')}
          </button>
          {status === 'success' && (
            <span className="flex items-center gap-1.5 text-sm text-(--hd-accent) animate-in zoom-in duration-200">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {t('settings.masterPasswordSuccess')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

function OnboardingTab() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)

  const handleReset = async () => {
    await window.api.resetOnboarding?.()
    setStatus('done')
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <RotateCw className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('misc.onboardingTitle')}</h3>
      </div>

      <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
        <div className="flex items-start justify-between gap-6">
          <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('misc.onboardingDesc')}</p>
          <button
            onClick={handleReset}
            disabled={status === 'done'}
            className={`shrink-0 flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all ${FOCUS_RING} ${
              status === 'done'
                ? 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent) cursor-default'
                : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2) hover:bg-(--hd-line) hover:text-(--hd-ink)'
            }`}
          >
            {status === 'done' ? (
              <>
                <CheckCircle2 className="size-3.5 text-(--hd-accent)" aria-hidden="true" />
                {t('misc.onboardingDone')}
              </>
            ) : (
              <>
                <RotateCw className="size-3.5" aria-hidden="true" />
                {t('misc.onboardingBtn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PatchNotesTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr'
  const show = (version) =>
    window.dispatchEvent(new CustomEvent('rootpass:show-patchnotes', { detail: { version } }))

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <ScrollText className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('patchNotes.title')}</h3>
          <p className="mt-1 text-sm text-(--hd-mute)">{t('patchNotes.settingsDesc')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {PATCH_NOTES.map((note, idx) => {
          const content = note[lang] || note.fr
          const counts = ['added', 'improved', 'fixed', 'removed']
            .map((k) => content?.[k]?.length || 0)
            .reduce((a, b) => a + b, 0)
          return (
            <button
              key={note.version}
              onClick={() => show(note.version)}
              className={`group flex w-full items-center gap-4 rounded-2xl border border-(--hd-line) bg-(--hd-card) p-5 text-left transition-all hover:border-(--hd-faint) hover:bg-(--hd-shell) ${FOCUS_RING}`}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft)">
                <ScrollText className="size-5 text-(--hd-accent)" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-(--hd-ink)">v{note.version}</span>
                  {idx === 0 && (
                    <span className="rounded-full bg-(--hd-accent-soft) px-2 py-0.5 text-[13px] font-bold text-(--hd-accent)">
                      {t('patchNotes.latest')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-(--hd-mute)">
                  {note.date} · {t('patchNotes.changeCount', { count: counts })}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-(--hd-mute) transition-transform group-hover:translate-x-0.5 group-hover:text-(--hd-ink2)"
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MaintenanceTab() {
  const { t } = useTranslation()
  const [phase, setPhase] = useState('idle')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [appliedCount, setAppliedCount] = useState(0)

  const scan = async () => {
    setPhase('scanning')
    try {
      const list = (await window.api.previewMissingUrls()) || []
      setSuggestions(list)
      setSelected(new Set(list.map((s) => s.id)))
      setPhase('review')
    } catch (e) {
      console.error(e)
      setPhase('idle')
    }
  }

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = suggestions.length > 0 && selected.size === suggestions.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(suggestions.map((s) => s.id)))

  const apply = async () => {
    setPhase('applying')
    const updates = suggestions
      .filter((s) => selected.has(s.id))
      .map((s) => ({ id: s.id, url: s.url }))
    try {
      const count = await window.api.applyUrls(updates)
      setAppliedCount(count)
      setPhase('done')
    } catch (e) {
      console.error(e)
      setPhase('review')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
          <Link2 className="size-6 text-(--hd-accent)" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('urlfill.title')}</h3>
          <p className="mt-1 text-sm text-(--hd-mute)">{t('urlfill.desc')}</p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--hd-accent)" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-(--hd-ink2)">{t('urlfill.privacy')}</p>
      </div>

      {(phase === 'idle' || phase === 'scanning') && (
        <button
          onClick={scan}
          disabled={phase === 'scanning'}
          className={`flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2.5 text-[13px] font-bold text-(--hd-on-accent) shadow-lg transition-all hover:brightness-110 disabled:opacity-50 ${FOCUS_RING}`}
        >
          {phase === 'scanning' ? (
            <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Link2 className="size-4" aria-hidden="true" />
          )}
          {phase === 'scanning' ? t('urlfill.scanning') : t('urlfill.scan')}
        </button>
      )}

      {phase === 'review' &&
        (suggestions.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--hd-line) bg-(--hd-card) p-6">
            <div className="flex items-center gap-2.5 text-(--hd-ink2)">
              <CheckCircle2 className="size-5 text-(--hd-accent)" aria-hidden="true" />
              <span className="text-[14px] font-medium">{t('urlfill.none')}</span>
            </div>
            <button
              onClick={scan}
              className={`text-[13px] font-medium text-(--hd-accent) hover:text-(--hd-accent) ${FOCUS_RING}`}
            >
              {t('urlfill.rescan')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-(--hd-ink2)">
                {t('urlfill.reviewTitle', { count: suggestions.length })}
              </p>
              <button
                onClick={toggleAll}
                className={`text-[12px] font-semibold text-(--hd-accent) hover:text-(--hd-accent) ${FOCUS_RING}`}
              >
                {allSelected ? t('urlfill.deselectAll') : t('urlfill.selectAll')}
              </button>
            </div>

            <div className="max-h-[42vh] divide-y divide-(--hd-line) overflow-y-auto rounded-2xl border border-(--hd-line) bg-(--hd-card)">
              {suggestions.map((s) => {
                const checked = selected.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={checked}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-(--hd-shell) ${FOCUS_RING}`}
                  >
                    <span
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        checked
                          ? 'border-(--hd-accent) bg-(--hd-accent) text-(--hd-on-accent)'
                          : 'border-(--hd-faint) bg-transparent'
                      }`}
                    >
                      {checked && <Check className="size-3" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-(--hd-ink)">
                      {s.title}
                    </span>
                    <ChevronRight className="size-3.5 shrink-0 text-(--hd-mute)" aria-hidden="true" />
                    <span className="shrink-0 truncate font-mono text-[12px] text-(--hd-accent)">
                      {s.url.replace(/^https?:\/\//, '')}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={apply}
                disabled={selected.size === 0}
                className={`flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2.5 text-[13px] font-bold text-(--hd-on-accent) shadow-lg transition-all hover:brightness-110 disabled:opacity-40 ${FOCUS_RING}`}
              >
                <Save className="size-4" aria-hidden="true" />
                {t('urlfill.applyCount', { count: selected.size })}
              </button>
              <button
                onClick={() => setPhase('idle')}
                className={`text-[13px] font-medium text-(--hd-mute) transition-colors hover:text-(--hd-ink2) ${FOCUS_RING}`}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ))}

      {phase === 'applying' && (
        <div className="flex items-center gap-2.5 text-(--hd-ink2)">
          <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          <span className="text-[14px]">{t('urlfill.applying')}</span>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) p-6">
          <div className="flex items-center gap-2.5 text-(--hd-ink)">
            <CheckCircle2 className="size-5 text-(--hd-accent)" aria-hidden="true" />
            <span className="text-[15px] font-bold">
              {t('urlfill.doneTitle', { count: appliedCount })}
            </span>
          </div>
          <button
            onClick={scan}
            className={`text-[13px] font-medium text-(--hd-accent) hover:text-(--hd-accent) ${FOCUS_RING}`}
          >
            {t('urlfill.rescan')}
          </button>
        </div>
      )}
    </div>
  )
}

function Settings({ initialTab = 'language' }) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab)

  const [shortcut, setShortcut] = useState('')
  const [spotlightEnabled, setSpotlightEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState(null)
  const [autoStart, setAutoStart] = useState(false)
  const [autoLockTime, setAutoLockTime] = useState(15)

  const [theme, setThemeState] = useState(getStoredTheme())

  const handleThemeChange = (next) => setThemeState(setTheme(next))

  const [autofill, setAutofill] = useState({ supported: false, enabled: false, shortcut: '' })
  const [isRecordingAutofill, setIsRecordingAutofill] = useState(false)
  const [autofillRecordError, setAutofillRecordError] = useState(null)

  useEffect(() => {
    window.api.getShortcut().then(setShortcut)
    window.api.getSpotlightEnabled?.().then((v) => typeof v === 'boolean' && setSpotlightEnabled(v))
    window.api.getAutoStart().then(setAutoStart)
    window.api.getAutoLock().then(setAutoLockTime)
    window.api.getAutofillStatus?.().then((s) => s && setAutofill(s))
  }, [])

  const toggleSpotlight = async () => {
    const next = !spotlightEnabled
    setSpotlightEnabled(next)
    if (!next) setIsRecording(false)
    const saved = await window.api.setSpotlightEnabled?.(next)
    if (typeof saved === 'boolean') setSpotlightEnabled(saved)
  }

  const toggleAutofill = async () => {
    const enabled = await window.api.setAutofillEnabled(!autofill.enabled)
    setAutofill((a) => ({ ...a, enabled }))
  }

  useEffect(() => {
    if (!isRecordingAutofill) return

    const handleKeyDown = async (e) => {
      e.preventDefault()
      if (e.key === 'Escape') {
        setIsRecordingAutofill(false)
        return
      }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        setAutofillRecordError(t('settings.comboError'))
        return
      }
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key
      keys.push(keyName)
      const newShortcut = keys.join('+')
      setIsRecordingAutofill(false)
      const res = await window.api.setAutofillShortcut(newShortcut)
      if (res?.error === 'conflict') {
        setAutofillRecordError(t('settings.autofillConflict'))
      } else {
        setAutofill((a) => ({ ...a, shortcut: res.shortcut }))
        setAutofillRecordError(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecordingAutofill, t])

  const handleAutoLockChange = (time) => {
    setAutoLockTime(time)
    window.api.setAutoLock(time)
  }

  const toggleAutoStart = async () => {
    const newState = !autoStart
    setAutoStart(newState)
    await window.api.setAutoStart(newState)
  }

  useEffect(() => {
    window.api.getShortcut().then(setShortcut)
  }, [])

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e) => {
      e.preventDefault()

      if (e.key === 'Escape') {
        setIsRecording(false)
        return
      }

      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        setRecordError(t('settings.comboError'))
        return
      }

      let keys = []
      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')

      const KEY_MAP = {
        ' ': 'Space',
        '+': 'Plus',
        '-': 'Minus',
        '=': 'Equal',
        '.': 'Period',
        ',': 'Comma',
        ';': 'Semicolon',
        "'": 'Quote',
        '[': 'BracketLeft',
        ']': 'BracketRight',
        '\\': 'Backslash',
        '/': 'Slash',
        '`': 'Backquote'
      }
      const keyName = KEY_MAP[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key)
      keys.push(keyName)

      const newShortcut = keys.join('+')
      setShortcut(newShortcut)
      setRecordError(null)
      setIsRecording(false)
      window.api.setShortcut(newShortcut)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording])

  const groups = [
    {
      id: 'general',
      label: t('settings.groupGeneral'),
      icon: Globe,
      tabs: [
        { id: 'language', label: t('settings.tabLanguage'), icon: Globe },
        { id: 'display', label: t('settings.tabDisplay'), icon: Palette },
        { id: 'system', label: t('settings.tabSystem'), icon: Laptop }
      ]
    },
    {
      id: 'productivity',
      label: t('settings.groupProductivity'),
      icon: Wand2,
      tabs: [
        { id: 'shortcuts', label: t('settings.tabShortcuts'), icon: Keyboard },
        { id: 'autofill', label: t('settings.tabAutofill'), icon: Wand2 },
        { id: 'extension', label: t('settings.tabExtension'), icon: Puzzle }
      ]
    },
    {
      id: 'security',
      label: t('settings.groupSecurity'),
      icon: ShieldCheck,
      tabs: [
        { id: 'twofa', label: t('settings.tab2fa'), icon: Smartphone },
        { id: 'hint', label: t('settings.tabHint'), icon: KeyRound },
        { id: 'masterPassword', label: t('settings.tabMasterPassword'), icon: Lock }
      ]
    },
    {
      id: 'sync',
      label: t('settings.groupSync'),
      icon: Cloud,
      tabs: [
        { id: 'sync-cloud', label: t('sync.methodCloud'), icon: Cloud },
        { id: 'sync-usb', label: t('sync.methodUsb'), icon: Usb },
        { id: 'sync-enc', label: t('sync.methodEnc'), icon: ShieldCheck },
        { id: 'sync-json', label: t('sync.methodJson'), icon: FileJson }
      ]
    },
    {
      id: 'other',
      label: t('settings.groupOther'),
      icon: ScrollText,
      tabs: [
        { id: 'maintenance', label: t('settings.tabMaintenance'), icon: Link2 },
        { id: 'onboarding', label: t('settings.tabOnboarding'), icon: RotateCw },
        { id: 'patchnotes', label: t('patchNotes.title'), icon: ScrollText }
      ]
    }
  ]

  const activeGroupId = groups.find((g) => g.tabs.some((t) => t.id === activeTab))?.id
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroupId]))

  const toggleGroup = (id) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 px-5 pb-8 pt-7 lg:flex-row lg:gap-10 lg:px-12 lg:pb-12 lg:pt-12">
      <aside className="hd-scroll w-full shrink-0 self-start overflow-y-auto rounded-[28px] bg-(--hd-card) p-6 shadow-(--hd-shadow-card) lg:w-64">
        <nav className="space-y-2" aria-label={t('settings.title')}>
          {groups.map((group) => {
            const GroupIcon = group.icon
            const isOpen = openGroups.has(group.id)
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-all ${FOCUS_RING} ${
                    group.id === activeGroupId
                      ? 'text-(--hd-accent)'
                      : 'text-(--hd-mute) hover:text-(--hd-ink2)'
                  }`}
                >
                  <GroupIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={`size-3.5 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="mt-1 space-y-1 pb-2">
                    {group.tabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        aria-current={activeTab === id ? 'page' : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 pl-8 text-left text-[13px] font-medium transition-all ${FOCUS_RING} ${
                          activeTab === id
                            ? 'border-(--hd-accent)/30 bg-(--hd-accent-soft) text-(--hd-accent)'
                            : 'border-transparent text-(--hd-mute) hover:bg-(--hd-shell) hover:text-(--hd-ink2)'
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="hd-scroll min-w-0 flex-1 overflow-y-auto pr-2">
        <div className="max-w-3xl">
          {activeTab === 'language' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Globe className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.languageTitle')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
                <p className="mb-6 text-sm leading-relaxed text-(--hd-ink2)">
                  {t('settings.languageDesc')}
                </p>

                <div className="space-y-2">
                  <label
                    htmlFor="language-select"
                    className="block text-[13px] font-bold text-(--hd-ink2)"
                  >
                    {t('settings.languageLabel')}
                  </label>
                  <LanguageSelect
                    value={i18n.language}
                    onChange={(code) => {
                      i18n.changeLanguage(code)
                      window.api.setLocale?.(code)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Palette className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.displayTitle')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
                <p className="mb-6 text-sm leading-relaxed text-(--hd-ink2)">
                  {t('settings.displayDesc')}
                </p>

                <div
                  role="radiogroup"
                  aria-label={t('settings.displayTitle')}
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    {
                      id: 'light',
                      icon: Sun,
                      label: t('settings.themeLight'),
                      desc: t('settings.themeLightDesc'),
                      shell: 'bg-[#f3f3f5]',
                      bar: 'bg-[#e1e1e6]',
                      card: 'bg-[#ffffff]',
                      line: 'bg-[#e1e1e6]'
                    },
                    {
                      id: 'dark',
                      icon: Moon,
                      label: t('settings.themeDark'),
                      desc: t('settings.themeDarkDesc'),
                      shell: 'bg-[#1a1a1d]',
                      bar: 'bg-[#34343a]',
                      card: 'bg-[#28282d]',
                      line: 'bg-[#34343a]'
                    }
                  ].map(({ id, icon: Icon, label, desc, shell, bar, card, line }) => {
                    const active = theme === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => handleThemeChange(id)}
                        className={`group relative flex flex-col gap-4 rounded-2xl border p-4 text-left transition-all ${FOCUS_RING} ${
                          active
                            ? 'border-(--hd-accent) bg-(--hd-accent-soft)'
                            : 'border-(--hd-line) bg-(--hd-card) hover:-translate-y-0.5 hover:bg-(--hd-shell)'
                        }`}
                      >
                        {active && (
                          <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-(--hd-accent) text-(--hd-on-accent) shadow-lg">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        )}

                        <div
                          className={`flex h-24 flex-col gap-2 overflow-hidden rounded-xl border border-(--hd-line) p-3 ${shell}`}
                          aria-hidden="true"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-(--hd-accent)" />
                            <span className={`h-2 w-12 rounded-full ${bar}`} />
                          </div>
                          <div className={`flex-1 rounded-lg p-2 ${card}`}>
                            <div className={`h-1.5 w-3/4 rounded-full ${line}`} />
                            <div className={`mt-1.5 h-1.5 w-1/2 rounded-full ${line}`} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`size-4 shrink-0 ${active ? 'text-(--hd-accent)' : 'text-(--hd-mute)'}`}
                            aria-hidden="true"
                          />
                          <div>
                            <p
                              className={`text-[13px] font-semibold ${active ? 'text-(--hd-accent)' : 'text-(--hd-ink)'}`}
                            >
                              {label}
                            </p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-(--hd-mute)">
                              {desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Keyboard className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.shortcutsTitle')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
                <p className="mb-6 text-sm leading-relaxed text-(--hd-ink2)">
                  {t('settings.shortcutsDesc')}
                </p>

                <div className="flex items-center justify-between gap-4 border-t border-(--hd-line) pt-6">
                  <div>
                    <h4 className="text-[14px] font-bold text-(--hd-ink)">
                      {t('settings.spotlightEnableTitle')}
                    </h4>
                    <p className="mt-1 text-[13px] text-(--hd-mute)">
                      {t('settings.spotlightEnableDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={spotlightEnabled}
                    aria-label={t('settings.spotlightEnableTitle')}
                    onClick={toggleSpotlight}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
                      spotlightEnabled ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
                        spotlightEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {spotlightEnabled && (
                  <div className="mt-6 space-y-3 border-t border-(--hd-line) pt-6">
                    <label className="block text-[13px] font-bold text-(--hd-ink2)">
                      {t('settings.spotlightShortcut')}
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className={`flex items-center gap-2 rounded-full px-5 py-3 font-mono text-sm transition-colors ${
                          isRecording
                            ? 'bg-(--hd-accent-soft) text-(--hd-accent)'
                            : 'bg-(--hd-shell) text-(--hd-ink2)'
                        }`}
                      >
                        {isRecording
                          ? t('settings.pressCombo')
                          : shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRecordError(null)
                          setIsRecording(true)
                        }}
                        disabled={isRecording}
                        className="hd-pill hd-pill-soft min-h-11 px-5 disabled:opacity-50"
                      >
                        {isRecording ? t('settings.recording') : t('common.edit')}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setRecordError(null)
                          try {
                            const ok = await window.api.testSpotlight?.()
                            if (ok === false) setRecordError(t('settings.spotlightTestFail'))
                          } catch {
                            setRecordError(t('settings.spotlightTestFail'))
                          }
                        }}
                        className="hd-pill hd-pill-tint min-h-11 px-5"
                      >
                        {t('settings.spotlightTest')}
                      </button>

                      {isRecording && (
                        <span className="animate-pulse text-xs text-(--hd-mute)">
                          {t('settings.escToCancel')}
                        </span>
                      )}
                    </div>

                    {recordError && <p className="text-xs text-(--hd-bad)">{recordError}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'autofill' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Wand2 className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.autofillTitle')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8  space-y-6">
                <p className="text-sm leading-relaxed text-(--hd-ink2)">
                  {t('settings.autofillDesc')}
                </p>

                {!autofill.supported ? (
                  <div className="flex items-start gap-3 rounded-xl border border-(--hd-warn)/30 bg-(--hd-warn)/12 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-(--hd-warn) mt-0.5" />
                    <p className="text-xs text-(--hd-warn) leading-relaxed">
                      {t('settings.autofillUnsupported')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-t border-(--hd-line) pt-6">
                      <div>
                        <h4 className="text-[13px] font-semibold text-(--hd-ink)">
                          {t('settings.autofillEnableTitle')}
                        </h4>
                        <p className="mt-1 text-xs text-(--hd-mute)">
                          {t('settings.autofillEnableDesc')}
                        </p>
                      </div>
                      <button
                        onClick={toggleAutofill}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
                          autofill.enabled ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
                            autofill.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className={`space-y-3 transition-opacity ${autofill.enabled ? '' : 'pointer-events-none opacity-40'}`}
                    >
                      <label className="block text-[13px] font-bold text-(--hd-ink2)">
                        {t('settings.autofillShortcut')}
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-mono text-sm transition-colors ${
                            isRecordingAutofill
                              ? 'border-(--hd-accent) bg-(--hd-accent-soft) text-(--hd-accent)'
                              : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-ink2)'
                          }`}
                        >
                          {isRecordingAutofill
                            ? t('settings.pressCombo')
                            : autofill.shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
                        </div>
                        <button
                          onClick={() => {
                            setAutofillRecordError(null)
                            setIsRecordingAutofill(true)
                          }}
                          disabled={isRecordingAutofill || !autofill.enabled}
                          className={`rounded-full px-4 py-3 text-[13px] font-medium transition-all ${FOCUS_RING} ${
                            isRecordingAutofill
                              ? 'bg-(--hd-line) text-(--hd-mute) cursor-not-allowed'
                              : 'bg-(--hd-shell) text-(--hd-ink2) hover:bg-(--hd-line) hover:text-(--hd-ink) border border-(--hd-line)'
                          }`}
                        >
                          {isRecordingAutofill ? t('settings.recording') : t('common.edit')}
                        </button>
                        {isRecordingAutofill && (
                          <span className="text-xs text-(--hd-mute) animate-pulse">
                            {t('settings.escToCancel')}
                          </span>
                        )}
                      </div>
                      {autofillRecordError && (
                        <p className="text-xs text-(--hd-bad)">{autofillRecordError}</p>
                      )}
                    </div>

                    <div className="border-t border-(--hd-line) pt-5 space-y-3">
                      <p className="text-[13px] font-semibold text-(--hd-mute)">
                        {t('settings.autofillHowTo')}
                      </p>
                      {t('settings.autofillSteps', { returnObjects: true }).map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                            {i + 1}
                          </span>
                          <p className="text-[13px] text-(--hd-mute)">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-3">
                        <Globe2 className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
                        <p className="text-[12px] leading-relaxed text-(--hd-mute)">
                          {t('settings.autofillBrowsers')}
                        </p>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-(--hd-line) bg-(--hd-card) px-4 py-3">
                        <MousePointerClick className="size-4 shrink-0 text-(--hd-accent) mt-0.5" />
                        <p className="text-[12px] leading-relaxed text-(--hd-mute)">
                          {t('settings.autofillLocal')}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'twofa' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Smartphone className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.2faTitle')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8  space-y-6">
                <p className="text-sm leading-relaxed text-(--hd-ink2)">{t('settings.2faDesc')}</p>

                <div className="space-y-3">
                  <p className="text-[13px] font-semibold text-(--hd-mute)">
                    {t('settings.2faHowTo')}
                  </p>
                  {t('settings.2faSteps', { returnObjects: true }).map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-(--hd-accent-soft) text-[12px] font-bold text-(--hd-accent)">
                        {i + 1}
                      </span>
                      <p className="text-[13px] text-(--hd-mute)">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) px-5 py-4 space-y-2">
                  <p className="text-[13px] font-semibold text-(--hd-ink)">
                    Migrer depuis Google Authenticator ou Authy
                  </p>
                  <p className="text-[12px] leading-relaxed text-(--hd-mute)">
                    Ces applications ne permettent pas d&apos;exporter les clés secrètes
                    directement. Pour chaque compte que vous souhaitez migrer : désactivez le 2FA
                    sur le site, réactivez-le, et enregistrez la clé secrète dans RootPass au moment
                    de la configuration. Pour les nouveaux comptes, utilisez RootPass dès le départ.
                  </p>
                </div>

                <div className="rounded-2xl border border-(--hd-accent)/30 bg-(--hd-accent-soft) px-5 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-(--hd-accent)" />
                    <p className="text-[13px] font-semibold text-(--hd-accent)">
                      {t('settings.2faSecureTitle')}
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-(--hd-ink2)">
                    {t('settings.2faSecureDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync-cloud' && <SyncTab method="cloud" />}

          {activeTab === 'sync-usb' && <SyncTab method="usb" />}

          {activeTab === 'sync-enc' && <SyncTab method="enc" />}

          {activeTab === 'sync-json' && <SyncTab method="json" />}

          {activeTab === 'extension' && <ExtensionTab />}

          {activeTab === 'masterPassword' && <MasterPasswordTab />}

          {activeTab === 'hint' && <HintTab />}

          {activeTab === 'maintenance' && <MaintenanceTab />}

          {activeTab === 'onboarding' && <OnboardingTab />}

          {activeTab === 'patchnotes' && <PatchNotesTab />}

          {activeTab === 'system' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-(--hd-line) bg-(--hd-shell) p-3 shadow-lg">
                  <Laptop className="size-6 text-(--hd-accent)" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-extrabold text-(--hd-ink)">{t('settings.tabSystem')}</h3>
              </div>

              <div className="rounded-[28px] bg-(--hd-card) shadow-(--hd-shadow-card) p-8 ">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-semibold text-(--hd-ink)">
                      {t('settings.autoLockTitle')}
                    </h4>
                    <p className="mt-1 text-xs text-(--hd-mute)">{t('settings.autoLockDesc')}</p>
                  </div>

                  <CustomSelect
                    value={autoLockTime}
                    onChange={handleAutoLockChange}
                    options={[
                      { value: 0, label: t('settings.autoLockNever') },
                      { value: 1, label: t('settings.autoLockMinute', { count: 1 }) },
                      { value: 5, label: t('settings.autoLockMinute', { count: 5 }) },
                      { value: 15, label: t('settings.autoLockMinute', { count: 15 }) },
                      { value: 30, label: t('settings.autoLockMinute', { count: 30 }) },
                      { value: 60, label: t('settings.autoLockHour', { count: 1 }) }
                    ]}
                    className="w-44"
                  />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-semibold text-(--hd-ink)">
                      {t('settings.autoStartTitle')}
                    </h4>
                    <p className="mt-1 text-xs text-(--hd-mute)">{t('settings.autoStartDesc')}</p>
                  </div>

                  <button
                    onClick={toggleAutoStart}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent) ${
                      autoStart ? 'bg-(--hd-accent)' : 'bg-(--hd-line)'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#fff] shadow ring-0 transition duration-200 ease-in-out ${
                        autoStart ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Settings

