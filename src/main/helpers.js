import path from 'path'
import os from 'os'
import * as fs from 'fs'

const LOCK_FILENAME = 'vault.lock'
const DB_FILENAME = 'vault_V2.db'

export function writeLockFile(dbPath) {
  const lockPath = path.join(path.dirname(dbPath), LOCK_FILENAME)
  try {
    fs.writeFileSync(lockPath, JSON.stringify({ host: os.hostname(), ts: Date.now() }))
  } catch {}
}

export function removeLockFile(dbPath) {
  const lockPath = path.join(path.dirname(dbPath), LOCK_FILENAME)
  try {
    if (fs.existsSync(lockPath)) {
      const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
      if (data.host === os.hostname()) fs.unlinkSync(lockPath)
    }
  } catch {}
}

export function checkLockFile(dbPath) {
  const lockPath = path.join(path.dirname(dbPath), LOCK_FILENAME)
  try {
    if (!fs.existsSync(lockPath)) return null
    const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
    const ageMs = Date.now() - data.ts
    if (ageMs > 2 * 60 * 1000) return null
    if (data.host === os.hostname()) return null
    return data.host
  } catch {
    return null
  }
}

export function detectConflictFiles(dbPath) {
  const dir = path.dirname(dbPath)
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.includes('vault_V2') && f.endsWith('.db') && f !== DB_FILENAME)
  } catch {
    return []
  }
}

export const MAIN_STRINGS = {
  fr: {
    exportWarnTitle: 'Export non chiffre',
    exportWarnMessage: 'Attention : export en clair',
    exportWarnDetail:
      "Le fichier JSON contiendra tous vos mots de passe en clair, lisibles par quiconque y accede. Pour une sauvegarde securisee, utilisez plutot l'export chiffre (.enc).",
    cancel: 'Annuler',
    exportAnyway: 'Exporter quand meme',
    exportEncTitle: 'Exporter le coffre chiffre',
    export: 'Exporter',
    rootpassBackup: 'Sauvegarde RootPass',
    allFiles: 'Tous les fichiers',
    importEncTitle: 'Importer un coffre chiffre',
    import: 'Importer',
    saveVaultTitle: 'Sauvegarder le coffre-fort',
    save: 'Sauvegarder',
    jsonFiles: 'Fichiers JSON',
    chooseSyncFolder: 'Choisir le dossier de synchronisation',
    useThisFolder: 'Utiliser ce dossier',
    trayOpen: 'Ouvrir RootPass',
    trayQuit: 'Quitter',
    trayTooltip: 'RootPass est securise en arriere-plan'
  },
  en: {
    exportWarnTitle: 'Unencrypted export',
    exportWarnMessage: 'Warning: plain-text export',
    exportWarnDetail:
      'The JSON file will contain all your passwords in plain text, readable by anyone who can access it. For a secure backup, use the encrypted export (.enc) instead.',
    cancel: 'Cancel',
    exportAnyway: 'Export anyway',
    exportEncTitle: 'Export encrypted vault',
    export: 'Export',
    rootpassBackup: 'RootPass Backup',
    allFiles: 'All files',
    importEncTitle: 'Import encrypted vault',
    import: 'Import',
    saveVaultTitle: 'Save the vault',
    save: 'Save',
    jsonFiles: 'JSON files',
    chooseSyncFolder: 'Choose the sync folder',
    useThisFolder: 'Use this folder',
    trayOpen: 'Open RootPass',
    trayQuit: 'Quit',
    trayTooltip: 'RootPass is secured in the background'
  }
}

export function mt(key, locale = 'fr') {
  return (MAIN_STRINGS[locale] || MAIN_STRINGS.fr)[key]
}
