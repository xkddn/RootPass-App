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
  Sparkles,
  RotateCw,
  KeyRound,
  Save,
  ScrollText,
  ChevronRight
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { getStoredTheme, setTheme } from '../theme'
import { PATCH_NOTES } from '../data/patchnotes'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

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
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-[13px] text-zinc-200 transition-all hover:border-white/[0.12] hover:bg-black/40 ${FOCUS_RING}`}
      >
        <span className="flex items-center gap-2.5">
          <span className={`${current.flagClass} rounded-sm`} aria-hidden="true" />
          <span>{current.label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-zinc-600 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('settings.chooseLang')}
          className="absolute top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-white/[0.07] bg-(--surface-solid) py-1 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-1 duration-150"
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
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/[0.04] ${FOCUS_RING} ${
                  isSelected ? 'text-emerald-400' : 'text-zinc-300'
                }`}
              >
                <span className={`${flagClass} rounded-sm`} aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
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
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 animate-in zoom-in duration-200">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
        <p className="text-sm text-emerald-300">{t('sync.conflictsCleaned')}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 animate-in zoom-in duration-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-red-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">
            {t('sync.conflictsDetected', { count: conflicts.length })}
          </p>
          <p className="mt-1 text-xs text-red-400/80 leading-relaxed">{t('sync.conflictsDesc')}</p>

          <ul className="mt-3 space-y-1">
            {conflicts.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <XCircle className="size-3.5 shrink-0 text-red-500/60" />
                <span className="font-mono text-[11px] text-red-400/70 truncate">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20 outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
    badgeColor: 'bg-emerald-500/15 text-emerald-400'
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
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
          {t('sync.currentFolder')}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
          <FolderOpen className="size-4 shrink-0 text-zinc-500" />
          <span className="truncate font-mono text-[12px] text-zinc-300">{folderDisplay}</span>
          {isCustom && (
            <span className="ml-auto shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onChangeFolder}
          disabled={syncOp === 'loading'}
          className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
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
            className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <RotateCcw className="size-4" />
            {t('sync.resetLocal')}
          </button>
        )}
      </div>

      {syncOp === 'success' && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 animate-in zoom-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
          <p className="text-sm text-emerald-300">{opMessage}</p>
        </div>
      )}
      {syncOp === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-in zoom-in duration-200">
          <XCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
          <p className="text-sm text-red-300">{opMessage}</p>
        </div>
      )}
    </div>
  )
}

function SyncTab() {
  const { t } = useTranslation()
  const [method, setMethod] = useState('cloud')
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
          <Cloud className="size-6 text-emerald-400" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-bold text-white">{t('sync.title')}</h3>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {SYNC_METHODS.map(({ id, icon: Icon, labelKey, subKey, badgeKey, badgeColor }) => {
          const active = method === id
          return (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                active
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              {badgeKey && (
                <span
                  className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeColor}`}
                >
                  {t(badgeKey)}
                </span>
              )}
              <Icon className={`size-5 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <div>
                <p
                  className={`text-[13px] font-semibold ${active ? 'text-emerald-300' : 'text-zinc-300'}`}
                >
                  {t(labelKey)}
                </p>
                <p className="text-[11px] text-zinc-600">{t(subKey)}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm space-y-6">
        {method === 'cloud' && (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">{t('sync.cloudDesc')}</p>
            <FolderSection
              status={status}
              syncOp={syncOp}
              opMessage={opMessage}
              onChangeFolder={handleChangeFolder}
              onReset={handleReset}
              badgeLabel={t('sync.methodCloud')}
            />
            <div className="border-t border-white/[0.04] pt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                {t('sync.howToConfigure')}
              </p>
              {t('sync.cloudSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-zinc-500">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {method === 'usb' && (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">{t('sync.usbDesc')}</p>
            <FolderSection
              status={status}
              syncOp={syncOp}
              opMessage={opMessage}
              onChangeFolder={handleChangeFolder}
              onReset={handleReset}
              badgeLabel={t('sync.methodUsb')}
            />
            <div className="border-t border-white/[0.04] pt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                {t('sync.howToUse')}
              </p>
              {t('sync.usbSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-zinc-500">{step}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-400/80 leading-relaxed">{t('sync.usbWarning')}</p>
            </div>
          </>
        )}

        {method === 'enc' && (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">{t('sync.encDesc')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/6 bg-white/2 px-4 py-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  {t('sync.vsCloudUsb')}
                </p>
                <p className="text-[12px] leading-relaxed text-zinc-500">
                  {t('sync.vsCloudUsbDesc')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-white/2 px-4 py-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  {t('sync.vsJson')}
                </p>
                <p className="text-[12px] leading-relaxed text-zinc-500">{t('sync.vsJsonDesc')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200">
                    {t('sync.exportHeading')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t('sync.encExportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEncModal('export')}
                    disabled={encOp === 'loading' && encActionType === 'export'}
                    className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  >
                    <ShieldCheck className="size-4" />
                    {t('sync.exportEncrypted')}
                  </button>
                  {encActionType === 'export' && encOp === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400 animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {encMessage}
                    </span>
                  )}
                  {encActionType === 'export' && encOp === 'wrong_password' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400 animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.wrongPassword')}
                    </span>
                  )}
                  {encActionType === 'export' && encOp === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400 animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {encMessage}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200">
                    {t('sync.importHeading')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t('sync.encImportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEncModal('import')}
                    disabled={encOp === 'loading' && encActionType === 'import'}
                    className="flex items-center gap-2 rounded-full border border-white/6 bg-white/4 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/8 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  >
                    <Download className="size-4" />
                    {t('sync.importEncrypted')}
                  </button>
                  {encActionType === 'import' && encOp === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400 animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {encMessage}
                    </span>
                  )}
                  {encActionType === 'import' && encOp === 'wrong_password' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400 animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.wrongPassword')}
                    </span>
                  )}
                  {encActionType === 'import' && encOp === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400 animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {encMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                {t('sync.howToMigrate')}
              </p>
              {t('sync.encSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-zinc-500">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {method === 'json' && (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">{t('sync.jsonDesc')}</p>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-5 py-4 space-y-3">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200">
                    {t('sync.exportHeading')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t('sync.jsonExportDesc')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  >
                    <Download className="size-4" />
                    {t('sync.exportJson')}
                  </button>
                  {exportStatus === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400 animate-in zoom-in duration-200">
                      <CheckCircle2 className="size-4" /> {t('sync.exportedShort')}
                    </span>
                  )}
                  {exportStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400 animate-in zoom-in duration-200">
                      <XCircle className="size-4" /> {t('sync.exportErrorShort')}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/20 px-5 py-4 space-y-2">
                <p className="text-[13px] font-semibold text-zinc-200">{t('sync.importHeading')}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t('sync.jsonImportDescPrefix')}{' '}
                  <span className="font-semibold text-zinc-400">{t('sync.jsonImportLabel')}</span>{' '}
                  {t('sync.jsonImportDescSuffix')}
                </p>
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                {t('sync.steps')}
              </p>
              {t('sync.jsonSteps', { returnObjects: true }).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-zinc-500">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-400/80 leading-relaxed">
                {t('sync.jsonWarningPrefix')} <strong>{t('sync.jsonWarningBold')}</strong>
                {t('sync.jsonWarningSuffix')}
              </p>
            </div>
          </>
        )}
      </div>

      {method !== 'json' && otherHost && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 animate-in zoom-in duration-200">
          <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">{t('sync.vaultMaybeOpen')}</p>
            <p className="mt-1 text-xs text-amber-400/80">
              {t('sync.vaultMaybeOpenDesc', { host: otherHost })}
            </p>
          </div>
        </div>
      )}

      {method !== 'json' && conflicts.length > 0 && (
        <ConflictResolver conflicts={conflicts} onResolved={loadStatus} />
      )}

      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-84 rounded-2xl border border-white/8 bg-(--surface-solid) p-6 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" />
              </div>
              <h4 className="text-[15px] font-bold text-white">
                {pwModal === 'export' ? t('sync.pwModalTitleExport') : t('sync.pwModalTitleImport')}
              </h4>
            </div>
            <p className="mb-4 text-[12px] leading-relaxed text-zinc-500">
              {pwModal === 'export' ? t('sync.pwModalDescExport') : t('sync.pwModalDescImport')}
            </p>
            <input
              type="password"
              autoFocus
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEncConfirm()}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-xl border border-white/8 bg-black/40 px-4 py-2.5 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setPwModal(null)
                  setPwValue('')
                }}
                className="rounded-xl px-4 py-2 text-[13px] text-zinc-400 transition-colors hover:text-zinc-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEncConfirm}
                disabled={!pwValue.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-bold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
      dot: 'bg-emerald-400',
      ring: 'bg-emerald-400/60',
      pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
    },
    paired: {
      label: t('settings.extStatusPaired'),
      desc: t('settings.extStatusPairedDesc'),
      dot: 'bg-amber-400',
      ring: 'bg-amber-400/50',
      pill: 'border-amber-500/25 bg-amber-500/10 text-amber-300'
    },
    offline: {
      label: t('settings.extStatusOffline'),
      desc: t('settings.extStatusOfflineDesc'),
      dot: 'bg-zinc-500',
      ring: 'bg-zinc-500/40',
      pill: 'border-white/[0.08] bg-white/[0.04] text-zinc-400'
    }
  }
  const meta = STATE_META[state]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
          <Puzzle className="size-6 text-emerald-400" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-bold text-white">{t('settings.extTitle')}</h3>
      </div>

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm space-y-6">
        <p className="text-sm leading-relaxed text-zinc-400">{t('settings.extDesc')}</p>

        <div className="flex items-center justify-between border-t border-white/[0.04] pt-6">
          <div>
            <h4 className="text-[13px] font-semibold text-zinc-200">
              {t('settings.extEnableTitle')}
            </h4>
            <p className="mt-1 text-xs text-zinc-500">{t('settings.extEnableDesc')}</p>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
              status.enabled ? 'bg-emerald-500' : 'bg-white/[0.1]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                status.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {!status.enabled && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <Puzzle className="size-4 shrink-0 text-zinc-500 mt-0.5" />
            <p className="text-xs leading-relaxed text-zinc-500">{t('settings.extDisabledNote')}</p>
          </div>
        )}

        {status.enabled && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4">
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
                <p className="text-[13px] font-semibold text-zinc-200">{meta.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{meta.desc}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${meta.pill}`}
            >
              {meta.label}
            </span>
          </div>
        )}

        {status.enabled && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div>
              <h4 className="text-[13px] font-semibold text-zinc-200">
                {t('settings.extAutoSubmitTitle')}
              </h4>
              <p className="mt-1 text-xs text-zinc-500">{t('settings.extAutoSubmitDesc')}</p>
            </div>
            <button
              onClick={toggleAutoSubmit}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                status.autoSubmit ? 'bg-emerald-500' : 'bg-white/[0.1]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  status.autoSubmit ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {status.enabled && status.pairings?.length > 0 && (
          <div className="space-y-3 border-t border-white/[0.04] pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                {t('settings.extPairedBrowsers')}
              </p>
              {status.pairings.length > 1 && (
                <button
                  onClick={() => handleRevoke('all')}
                  onBlur={() => confirmRevoke === 'all' && setConfirmRevoke(null)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                    confirmRevoke === 'all'
                      ? 'border-red-500/40 bg-red-500/15 text-red-300'
                      : 'border-white/[0.06] bg-white/[0.04] text-zinc-500 hover:bg-red-500/10 hover:text-red-300'
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
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <Globe2 className="size-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-zinc-200">{p.label}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                      />
                      <span className="text-[11px] text-zinc-500">
                        {p.connected ? t('settings.extConnected') : t('settings.extOffline')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(p.extId)}
                  onBlur={() => confirmRevoke === p.extId && setConfirmRevoke(null)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                    confirmRevoke === p.extId
                      ? 'border-red-500/40 bg-red-500/15 text-red-300'
                      : 'border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:bg-red-500/10 hover:text-red-300'
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
            <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-5 animate-in zoom-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-emerald-300">
                  {t('settings.extCodeTitle')}
                </p>
                <span className="font-mono text-[11px] tabular-nums text-emerald-400/70">
                  {remaining > 0 ? t('settings.extCodeExpiresIn', { seconds: remaining }) : ''}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">{t('settings.extCodeDesc')}</p>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {code.split('').map((d, i) => (
                    <span
                      key={i}
                      className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 font-mono text-xl font-bold tabular-nums text-white"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  aria-label={t('totp.copyCode')}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20 ${FOCUS_RING}`}
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
                <button
                  onClick={handleConnect}
                  className={`ml-auto flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white ${FOCUS_RING}`}
                >
                  <RefreshCw className="size-3.5" />
                  {t('settings.extNewCode')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.04] pt-6">
              <button
                onClick={handleConnect}
                className={
                  status.paired
                    ? `flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white ${FOCUS_RING}`
                    : 'flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'
                }
              >
                <Link2 className="size-4" />
                {status.paired ? t('settings.extConnectAnother') : t('settings.extConnect')}
              </button>
            </div>
          ))}

        <div className="border-t border-white/[0.04] pt-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
            {t('settings.extHowTo')}
          </p>
          {t('settings.extSteps', { returnObjects: true }).map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                {i + 1}
              </span>
              <p className="text-[13px] text-zinc-500">{step}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
            <Globe2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-zinc-500">
              {t('settings.extSecurityLocal')}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-zinc-500">
              {t('settings.extSecurityKey')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiscTab() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)

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

  const handleReset = async () => {
    await window.api.resetOnboarding?.()
    setStatus('done')
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
          <Sparkles className="size-6 text-emerald-400" aria-hidden="true" />
        </div>
        <h3 className="text-3xl font-bold text-white">{t('misc.tabLabel')}</h3>
      </div>

      <div className="mb-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <KeyRound className="size-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-zinc-200">{t('misc.hintTitle')}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t('misc.hintDesc')}</p>

            <div className="mt-5 space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                {t('misc.hintLabel')}
              </label>
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value.slice(0, 120))}
                placeholder={t('misc.hintPlaceholder')}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="ml-1 text-[11px] tabular-nums text-zinc-600">{hint.length}/120</p>
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="text-xs leading-relaxed text-amber-400/80">{t('misc.hintWarning')}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleSaveHint}
                disabled={hintSaved}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all ${FOCUS_RING} ${
                  hintSaved
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 cursor-default'
                    : 'border-transparent bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:bg-emerald-400'
                }`}
              >
                {hintSaved ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden="true" />
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
      </div>

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <RotateCw className="size-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-zinc-200">{t('misc.onboardingTitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t('misc.onboardingDesc')}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={status === 'done'}
            className={`shrink-0 flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all ${FOCUS_RING} ${
              status === 'done'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 cursor-default'
                : 'border-white/[0.06] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {status === 'done' ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden="true" />
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
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
          <ScrollText className="size-6 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-white">{t('patchNotes.title')}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t('patchNotes.settingsDesc')}</p>
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
              className={`group flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04] ${FOCUS_RING}`}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <ScrollText className="size-5 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-white">v{note.version}</span>
                  {idx === 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      {t('patchNotes.latest')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {note.date} · {t('patchNotes.changeCount', { count: counts })}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Settings({ initialTab = 'language' }) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab)

  const [shortcut, setShortcut] = useState('')
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
    window.api.getAutoStart().then(setAutoStart)
    window.api.getAutoLock().then(setAutoLockTime)
    window.api.getAutofillStatus?.().then((s) => s && setAutofill(s))
  }, [])

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

  const tabs = [
    { id: 'language', label: t('settings.tabLanguage'), icon: Globe },
    { id: 'display', label: t('settings.tabDisplay'), icon: Palette },
    { id: 'shortcuts', label: t('settings.tabShortcuts'), icon: Keyboard },
    { id: 'autofill', label: t('settings.tabAutofill'), icon: Wand2 },
    { id: 'extension', label: t('settings.tabExtension'), icon: Puzzle },
    { id: 'system', label: t('settings.tabSystem'), icon: Laptop },
    { id: 'twofa', label: t('settings.tab2fa'), icon: Smartphone },
    { id: 'sync', label: t('settings.tabSync'), icon: Cloud },
    { id: 'patchnotes', label: t('patchNotes.title'), icon: ScrollText },
    { id: 'misc', label: t('misc.tabLabel'), icon: Sparkles }
  ]

  return (
    <div className="flex h-full w-full">
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-white/[0.01] p-8">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-white">{t('settings.title')}</h2>

        <nav className="space-y-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all ${FOCUS_RING} ${
                activeTab === id
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }`}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-2xl">
          {activeTab === 'language' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Globe className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.languageTitle')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                  {t('settings.languageDesc')}
                </p>

                <div className="space-y-2">
                  <label
                    htmlFor="language-select"
                    className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600"
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
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Palette className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.displayTitle')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
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
                      shell: 'bg-[#ece8dd]',
                      bar: 'bg-[#d6d2c6]',
                      card: 'bg-[#ffffff]',
                      line: 'bg-[#d6d2c6]'
                    },
                    {
                      id: 'dark',
                      icon: Moon,
                      label: t('settings.themeDark'),
                      desc: t('settings.themeDarkDesc'),
                      shell: 'bg-[#08080a]',
                      bar: 'bg-[#34343a]',
                      card: 'bg-[#17171b]',
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
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:-translate-y-0.5 hover:bg-white/[0.04]'
                        }`}
                      >
                        {active && (
                          <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        )}

                        <div
                          className={`flex h-24 flex-col gap-2 overflow-hidden rounded-xl border border-black/10 p-3 ${shell}`}
                          aria-hidden="true"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className={`h-2 w-12 rounded-full ${bar}`} />
                          </div>
                          <div className={`flex-1 rounded-lg p-2 ${card}`}>
                            <div className={`h-1.5 w-3/4 rounded-full ${line}`} />
                            <div className={`mt-1.5 h-1.5 w-1/2 rounded-full ${line}`} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`size-4 shrink-0 ${active ? 'text-emerald-400' : 'text-zinc-500'}`}
                            aria-hidden="true"
                          />
                          <div>
                            <p
                              className={`text-[13px] font-semibold ${active ? 'text-emerald-300' : 'text-zinc-200'}`}
                            >
                              {label}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
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
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Keyboard className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.shortcutsTitle')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                  {t('settings.shortcutsDesc')}
                </p>

                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    {t('settings.spotlightShortcut')}
                  </label>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-mono text-sm transition-colors ${
                        isRecording
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/[0.06] bg-black/30 text-zinc-300'
                      }`}
                    >
                      {isRecording
                        ? t('settings.pressCombo')
                        : shortcut.replace('CommandOrControl', 'Ctrl/Cmd')}
                    </div>

                    <button
                      onClick={() => {
                        setRecordError(null)
                        setIsRecording(true)
                      }}
                      disabled={isRecording}
                      className={`rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${FOCUS_RING} ${
                        isRecording
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      {isRecording ? t('settings.recording') : t('common.edit')}
                    </button>

                    {isRecording && (
                      <span className="text-xs text-zinc-500 animate-pulse">
                        {t('settings.escToCancel')}
                      </span>
                    )}
                  </div>

                  {recordError && <p className="text-xs text-red-400">{recordError}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'autofill' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Wand2 className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.autofillTitle')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm space-y-6">
                <p className="text-sm leading-relaxed text-zinc-400">
                  {t('settings.autofillDesc')}
                </p>

                {!autofill.supported ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-400/80 leading-relaxed">
                      {t('settings.autofillUnsupported')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-6">
                      <div>
                        <h4 className="text-[13px] font-semibold text-zinc-200">
                          {t('settings.autofillEnableTitle')}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          {t('settings.autofillEnableDesc')}
                        </p>
                      </div>
                      <button
                        onClick={toggleAutofill}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                          autofill.enabled ? 'bg-emerald-500' : 'bg-white/[0.1]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autofill.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className={`space-y-3 transition-opacity ${autofill.enabled ? '' : 'pointer-events-none opacity-40'}`}
                    >
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                        {t('settings.autofillShortcut')}
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-mono text-sm transition-colors ${
                            isRecordingAutofill
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                              : 'border-white/[0.06] bg-black/30 text-zinc-300'
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
                          className={`rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${FOCUS_RING} ${
                            isRecordingAutofill
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                          }`}
                        >
                          {isRecordingAutofill ? t('settings.recording') : t('common.edit')}
                        </button>
                        {isRecordingAutofill && (
                          <span className="text-xs text-zinc-500 animate-pulse">
                            {t('settings.escToCancel')}
                          </span>
                        )}
                      </div>
                      {autofillRecordError && (
                        <p className="text-xs text-red-400">{autofillRecordError}</p>
                      )}
                    </div>

                    <div className="border-t border-white/[0.04] pt-5 space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                        {t('settings.autofillHowTo')}
                      </p>
                      {t('settings.autofillSteps', { returnObjects: true }).map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                            {i + 1}
                          </span>
                          <p className="text-[13px] text-zinc-500">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
                        <Globe2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                        <p className="text-[12px] leading-relaxed text-zinc-500">
                          {t('settings.autofillBrowsers')}
                        </p>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
                        <MousePointerClick className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                        <p className="text-[12px] leading-relaxed text-zinc-500">
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
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Smartphone className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.2faTitle')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm space-y-6">
                <p className="text-sm leading-relaxed text-zinc-400">{t('settings.2faDesc')}</p>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    {t('settings.2faHowTo')}
                  </p>
                  {t('settings.2faSteps', { returnObjects: true }).map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                        {i + 1}
                      </span>
                      <p className="text-[13px] text-zinc-500">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4 space-y-2">
                  <p className="text-[13px] font-semibold text-zinc-200">
                    Migrer depuis Google Authenticator ou Authy
                  </p>
                  <p className="text-[12px] leading-relaxed text-zinc-500">
                    Ces applications ne permettent pas d&apos;exporter les clés secrètes
                    directement. Pour chaque compte que vous souhaitez migrer : désactivez le 2FA
                    sur le site, réactivez-le, et enregistrez la clé secrète dans RootPass au moment
                    de la configuration. Pour les nouveaux comptes, utilisez RootPass dès le départ.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/[0.12] bg-emerald-500/[0.05] px-5 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                    <p className="text-[13px] font-semibold text-emerald-300">
                      {t('settings.2faSecureTitle')}
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-zinc-400">
                    {t('settings.2faSecureDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && <SyncTab />}

          {activeTab === 'extension' && <ExtensionTab />}

          {activeTab === 'patchnotes' && <PatchNotesTab />}

          {activeTab === 'misc' && <MiscTab />}

          {activeTab === 'system' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-lg shadow-black/20">
                  <Laptop className="size-6 text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white">{t('settings.tabSystem')}</h3>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-semibold text-zinc-200">
                      {t('settings.autoLockTitle')}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">{t('settings.autoLockDesc')}</p>
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
                    <h4 className="text-[13px] font-semibold text-zinc-200">
                      {t('settings.autoStartTitle')}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">{t('settings.autoStartDesc')}</p>
                  </div>

                  <button
                    onClick={toggleAutoStart}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                      autoStart ? 'bg-emerald-500' : 'bg-white/[0.1]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
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
