import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ClipboardPaste, Download, Loader2, FileText, Braces, Table2, Upload } from 'lucide-react'

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

function splitCsvRows(text, delim) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delim) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const CSV_FIELD_ALIASES = {
  title: ['name', 'title', 'account', 'account name', 'item name', 'entry', 'entry name'],
  url: ['url', 'website', 'web site', 'login_uri', 'uri', 'site', 'web address', 'hostname', 'login uri'],
  login: ['username', 'user name', 'login', 'login_username', 'email', 'e-mail', 'user', 'login username'],
  password: ['password', 'login_password', 'pass', 'pwd', 'login password'],
  notes: ['notes', 'note', 'comment', 'comments', 'extra'],
  category: ['category', 'folder', 'group', 'grouping'],
  totp: ['totp', 'login_totp', 'otpauth', 'otp', '2fa', 'authenticator key', 'login totp']
}

const CSV_IGNORED_COLUMNS = ['favorite', 'type', 'reprompt', 'fields', 'android_uri']

/**
 * @param {string} text
 * @returns {Array<{ title: string, login: string, password: string, custom_fields: {label:string,value:string}[], category: string, url: string, notes: string }>}
 */
function parseCsv(text) {
  const trimmed = text.trim()
  if (!trimmed) return []

  const firstLine = trimmed.split(/\r?\n/)[0]
  const counts = { ',': 0, ';': 0, '\t': 0 }
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++
  }
  const delim = Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), ',')

  const rows = splitCsvRows(trimmed, delim).filter((r) => r.some((c) => c.trim() !== ''))
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const indexOf = (aliases) => headers.findIndex((h) => aliases.includes(h))

  const map = {}
  for (const [field, aliases] of Object.entries(CSV_FIELD_ALIASES)) {
    map[field] = indexOf(aliases)
  }
  const knownIndexes = new Set(Object.values(map).filter((i) => i >= 0))

  const entries = []
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const get = (i) => (i >= 0 && i < cells.length ? (cells[i] || '').trim() : '')

    const title = get(map.title)
    const login = get(map.login)
    const password = get(map.password)
    const url = get(map.url)
    const notes = get(map.notes)
    const category = get(map.category)
    const totp = get(map.totp)

    if (!title && !login && !password) continue

    const custom_fields = []
    if (totp) custom_fields.push({ label: 'TOTP', value: totp })
    headers.forEach((h, i) => {
      if (knownIndexes.has(i) || CSV_IGNORED_COLUMNS.includes(h)) return
      const value = get(i)
      if (value) custom_fields.push({ label: rows[0][i].trim() || `Champ ${i + 1}`, value })
    })

    entries.push({
      title: title || login || 'Imported',
      url,
      login,
      password,
      notes,
      category: category || 'Autres',
      custom_fields
    })
  }

  return entries
}

/** @param {{ onClose: () => void, onSuccess: () => void }} props */
function ImportModal({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const parsedTxt = useMemo(() => (mode === 'text' ? parseTxt(text) : []), [mode, text])
  const parsedCsv = useMemo(() => (mode === 'csv' ? parseCsv(text) : []), [mode, text])
  const previewEntries = mode === 'csv' ? parsedCsv : parsedTxt
  const hasPreview = mode === 'text' || mode === 'csv'

  const handlePaste = async () => {
    try {
      const clip = await window.api.readClipboard()
      setText(clip)
    } catch (error) {
      console.error('Erreur lors de la lecture du presse-papier :', error)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setText(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsText(file)
    e.target.value = ''
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
        accounts = mode === 'csv' ? parsedCsv : parsedTxt
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
    <div
      className="rp-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rp-panel-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-(--surface-solid) shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
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
              onClick={() => setMode('csv')}
              className={tabClass(mode === 'csv')}
            >
              <Table2 className="size-3.5" />
              {t('importModal.tabCsv')}
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

          <div className="flex items-center justify-between gap-2">
            <label className="text-sm text-zinc-400">
              {mode === 'text'
                ? t('importModal.textLabel')
                : mode === 'csv'
                  ? t('importModal.csvLabel')
                  : t('importModal.label')}
            </label>
            <div className="flex items-center gap-2">
              {mode === 'csv' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Upload className="size-3.5" />
                    {t('importModal.loadFile')}
                  </button>
                </>
              )}
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
          </div>

          {mode === 'text' && (
            <p className="-mt-2 text-xs leading-relaxed text-zinc-600">
              {t('importModal.textHint')}
            </p>
          )}
          {mode === 'csv' && (
            <p className="-mt-2 text-xs leading-relaxed text-zinc-600">
              {t('importModal.csvHint')}
            </p>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={
              mode === 'text'
                ? 'Airfrance : moi@mail.com / infoSupplémentaire / monMotDePasse\n\nBoulanger : moi@mail.com / motDePasse\n\nNetflix : moi@mail.com / motDePasse'
                : mode === 'csv'
                  ? 'name,url,username,password\nNetflix,https://netflix.com,moi@mail.com,secret\nAmazon,https://amazon.fr,moi@mail.com,motDePasse'
                  : '[\n  {\n    "title": "Netflix",\n    "url": "https://netflix.com",\n    "login": "moi@mail.com",\n    "password": "secret"\n  }\n]'
            }
            className="h-56 max-h-[55vh] min-h-[7rem] w-full shrink-0 resize-y rounded-2xl border border-white/[0.08] bg-black/40 p-4 font-mono text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          {hasPreview && text.trim() && (
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-2 flex shrink-0 items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t('importModal.preview')}
                </span>
                <span
                  className={`text-xs font-medium ${
                    previewEntries.length > 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {previewEntries.length > 0
                    ? t('importModal.previewCount', { count: previewEntries.length })
                    : t('importModal.noEntries')}
                </span>
              </div>
              {previewEntries.length > 0 && (
                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                  {previewEntries.map((acc, i) => (
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
            disabled={isSubmitting || (hasPreview && previewEntries.length === 0)}
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-500"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isSubmitting
              ? t('importModal.importing')
              : hasPreview && previewEntries.length > 0
                ? t('importModal.importN', { count: previewEntries.length })
                : t('importModal.import')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
