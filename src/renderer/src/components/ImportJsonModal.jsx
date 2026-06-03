import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ClipboardPaste, Download, Loader2 } from 'lucide-react'

/** @param {{ onClose: () => void, onSuccess: () => void }} props */
function ImportJsonModal({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [jsonText, setJsonText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePaste = async () => {
    try {
      const text = await window.api.readClipboard()
      setJsonText(text)
    } catch (error) {
      console.error('Erreur lors de la lecture du presse-papier :', error)
    }
  }

  const handleImport = async () => {
    if (!jsonText.trim()) {
      alert(t('importModal.emptyError'))
      return
    }

    setIsSubmitting(true)

    try {
      const jsonData = JSON.parse(jsonText)

      if (!Array.isArray(jsonData)) {
        throw new Error('not an array')
      }

      await window.api.importAccounts(jsonData)
      alert(t('dashboard.importSuccess'))
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erreur lors de l'import :", error)
      alert(t('importModal.notArrayError'))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0C0C0F] shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
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

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-400">{t('importModal.label')}</label>
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

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            placeholder={
              '[\n  {\n    "title": "Netflix",\n    "url": "https://netflix.com",\n    "login": "moi@mail.com",\n    "password": "secret"\n  }\n]'
            }
            className="h-64 w-full resize-none rounded-2xl border border-white/[0.08] bg-black/40 p-4 font-mono text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          <div className="mt-1 flex justify-end gap-3">
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
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-500"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isSubmitting ? t('importModal.importing') : t('importModal.import')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportJsonModal
