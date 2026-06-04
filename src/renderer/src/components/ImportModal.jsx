import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ClipboardPaste, Download, Loader2, FileText, Braces } from 'lucide-react'

/**
 * @param {string} text
 * @returns {Array<{ title: string, login: string, password: string, custom_fields: {label:string,value:string}[], category: string, url: string }>}
 */
function parseTxt(text) {
  const entries = []

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue

    if (/^[\p{L}\p{N}]\s*-\s*$/u.test(line)) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const title = line.slice(0, colonIdx).trim()
    if (!title) continue

    const parts = line
      .slice(colonIdx + 1)
      .split('/')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    let login = ''
    let password = ''
    const custom_fields = []

    if (parts.length === 1) {
      password = parts[0]
    } else if (parts.length >= 2) {
      login = parts[0]
      password = parts[parts.length - 1]
      const middle = parts.slice(1, -1)
      middle.forEach((value, i) => {
        const label = middle.length === 1 ? 'Info' : `Info ${i + 1}`
        custom_fields.push({ label, value })
      })
    }

    entries.push({ title, login, password, custom_fields, category: 'Autres', url: '' })
  }

  return entries
}

/** @param {{ onClose: () => void, onSuccess: () => void }} props */
function ImportModal({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedTxt = useMemo(() => (mode === 'text' ? parseTxt(text) : []), [mode, text])

  const handlePaste = async () => {
    try {
      const clip = await window.api.readClipboard()
      setText(clip)
    } catch (error) {
      console.error('Erreur lors de la lecture du presse-papier :', error)
    }
  }

  const handleImport = async () => {
    if (!text.trim()) {
      alert(t('importModal.emptyError'))
      return
    }

    setIsSubmitting(true)
    try {
      let accounts
      if (mode === 'json') {
        accounts = JSON.parse(text)
        if (!Array.isArray(accounts)) throw new Error('not an array')
      } else {
        accounts = parsedTxt
        if (accounts.length === 0) {
          alert(t('importModal.noEntries'))
          setIsSubmitting(false)
          return
        }
      }

      await window.api.importAccounts(accounts)
      alert(t('dashboard.importSuccess'))
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erreur lors de l'import :", error)
      alert(t('importModal.notArrayError'))
      setIsSubmitting(false)
    }
  }

  const tabClass = (active) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
      active ? 'bg-white/[0.06] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0C0C0F] shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
              <Download className="size-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {t('importModal.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
          <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={tabClass(mode === 'text')}
            >
              <FileText className="size-3.5" />
              {t('importModal.tabText')}
            </button>
            <button
              type="button"
              onClick={() => setMode('json')}
              className={tabClass(mode === 'json')}
            >
              <Braces className="size-3.5" />
              {t('importModal.tabJson')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-400">
              {mode === 'text' ? t('importModal.textLabel') : t('importModal.label')}
            </label>
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
              title={t('importModal.pasteTitle')}
            >
              <ClipboardPaste className="size-3.5" />
              {t('importModal.paste')}
            </button>
          </div>

          {mode === 'text' && (
            <p className="-mt-2 text-xs leading-relaxed text-zinc-600">
              {t('importModal.textHint')}
            </p>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={
              mode === 'text'
                ? 'A-\nAirfrance : moi@mail.com / monIdentifiant / monMotDePasse\n\nB-\nBoulanger : moi@mail.com / motDePasse'
                : '[\n  {\n    "title": "Netflix",\n    "url": "https://netflix.com",\n    "login": "moi@mail.com",\n    "password": "secret"\n  }\n]'
            }
            className="h-56 max-h-[55vh] min-h-[7rem] w-full shrink-0 resize-y rounded-2xl border border-white/[0.08] bg-black/40 p-4 font-mono text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          {mode === 'text' && text.trim() && (
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 flex shrink-0 items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t('importModal.preview')}
                </span>
                <span
                  className={`text-xs font-medium ${
                    parsedTxt.length > 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {parsedTxt.length > 0
                    ? t('importModal.previewCount', { count: parsedTxt.length })
                    : t('importModal.noEntries')}
                </span>
              </div>
              {parsedTxt.length > 0 && (
                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                  {parsedTxt.map((acc, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-1.5 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-200">
                        {acc.title}
                      </span>
                      <span className="shrink-0 truncate text-zinc-500" style={{ maxWidth: '45%' }}>
                        {acc.login || t('importModal.noLogin')}
                      </span>
                      {acc.custom_fields.length > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          {t('importModal.fieldsBadge', { count: acc.custom_fields.length })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSubmitting || (mode === 'text' && parsedTxt.length === 0)}
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-500"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isSubmitting
              ? t('importModal.importing')
              : mode === 'text' && parsedTxt.length > 0
                ? t('importModal.importN', { count: parsedTxt.length })
                : t('importModal.import')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
