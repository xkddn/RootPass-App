import pkg from 'electron-updater'
import { app, ipcMain } from 'electron'

const { autoUpdater } = pkg

/**
 * @param {{ getWindow: () => import('electron').BrowserWindow | null, onBeforeInstall?: () => void }} opts
 */
export function initAutoUpdater({ getWindow, onBeforeInstall }) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const send = (status, data = {}) => {
    const win = getWindow?.()
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:status', { status, ...data })
    }
  }

  autoUpdater.on('checking-for-update', () => send('checking'))
  autoUpdater.on('update-available', (info) => send('available', { version: info?.version }))
  autoUpdater.on('update-not-available', () => send('not-available'))
  autoUpdater.on('error', (err) => send('error', { message: err?.message || String(err) }))
  autoUpdater.on('download-progress', (p) =>
    send('downloading', { percent: Math.round(p?.percent || 0) })
  )
  autoUpdater.on('update-downloaded', (info) => send('downloaded', { version: info?.version }))

  ipcMain.handle('updater:getVersion', () => app.getVersion())

  ipcMain.handle('updater:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (e) {
      console.error('Erreur vérification MAJ :', e?.message || e)
      return { ok: false, error: e?.message || String(e) }
    }
  })

  ipcMain.handle('updater:install', () => {
    onBeforeInstall?.()
    autoUpdater.quitAndInstall()
    return true
  })

  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch((e) => {
      console.error('Erreur vérification MAJ au démarrage :', e?.message || e)
    })
  }
}
