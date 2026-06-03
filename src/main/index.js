import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  clipboard,
  dialog,
  Tray,
  Menu,
  globalShortcut,
  screen,
  powerMonitor
} from 'electron'
import { join } from 'node:path'
import path from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import trayIcon from '../../resources/img/icon-32.png?asset'
import * as fs from 'node:fs'
import {
  addAccount,
  getAllAccounts,
  updateAccount,
  deleteAccount,
  importAccounts,
  toggleFavorite,
  exportEncryptedVault,
  importEncryptedVault
} from './accounts.js'
import { openDatabase, getCurrentDbPath, getDefaultDbPath, closeDatabase } from './database.js'
import { lockVault, isVaultInitialized, setupMasterPassword, verifyMasterPassword } from './auth.js'
import {
  writeLockFile,
  removeLockFile,
  checkLockFile,
  detectConflictFiles,
  mt as _mt
} from './helpers.js'
import { initAutoUpdater } from './updater.js'

const DB_FILENAME = 'vault_V2.db'

let tray = null
let mainWindow = null
let isQuitting = false
let isSpotlightActive = false
let currentShortcut = 'CommandOrControl+Shift+P'
let currentLocale = 'fr'

const mt = (key) => _mt(key, currentLocale)

function refreshLockFile() {
  writeLockFile(getCurrentDbPath())
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 730,
    show: false,
    autoHideMenuBar: true,
    icon: trayIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('close', async (event) => {
    if (!isQuitting) {
      event.preventDefault()

      if (isSpotlightActive) {
        mainWindow.hide()
        return
      }

      const prefsPath = join(app.getPath('userData'), 'preferences.json')
      let hideWarning = false

      if (fs.existsSync(prefsPath)) {
        try {
          const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
          hideWarning = prefs.hideWarning === true
        } catch (e) {
          console.error('Erreur lecture prefs', e)
        }
      }

      if (!hideWarning) {
        const response = await new Promise((resolve) => {
          ipcMain.once('background-warning-response', (_, data) => resolve(data))
          mainWindow.webContents.send('show-background-warning', {
            shortcut: currentShortcut.replace('CommandOrControl', 'Ctrl/Cmd')
          })
        })

        if (response.checkboxChecked) {
          let prefs = {}
          try {
            if (fs.existsSync(prefsPath)) prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
          } catch (e) {
            console.error('Lecture prefs échouée', e)
          }
          prefs.hideWarning = true
          fs.writeFileSync(prefsPath, JSON.stringify(prefs))
        }
      }
      mainWindow.hide()
    }
  })

  mainWindow.on('ready-to-show', () => {
    const isHiddenStart = process.argv.includes('--hidden')

    if (isHiddenStart) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (is.dev && devUrl && url.startsWith(devUrl)) return
    event.preventDefault()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+P'
const SPOTLIGHT_WIDTH = 690
const SPOTLIGHT_MIN_HEIGHT = 400
const SPOTLIGHT_MAX_HEIGHT = 520

function showAsSpotlight() {
  mainWindow.setMenuBarVisibility(false)
  const { workArea } = screen.getPrimaryDisplay()
  const x = Math.round(workArea.x + (workArea.width - SPOTLIGHT_WIDTH) / 2)
  const y = Math.round(workArea.y + workArea.height * 0.18)
  mainWindow.setBounds({ x, y, width: SPOTLIGHT_WIDTH, height: SPOTLIGHT_MIN_HEIGHT })
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('toggle-spotlight', true)
}

function toggleSpotlight() {
  if (mainWindow.isVisible()) {
    isSpotlightActive = false
    mainWindow.hide()
  } else {
    isSpotlightActive = true
    if (mainWindow.isFullScreen()) {
      mainWindow.once('leave-full-screen', showAsSpotlight)
      mainWindow.setFullScreen(false)
    } else {
      showAsSpotlight()
    }
  }
}

function registerSpotlightShortcut() {
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(currentShortcut, toggleSpotlight)
  if (!ok) {
    currentShortcut = DEFAULT_SHORTCUT
    globalShortcut.register(DEFAULT_SHORTCUT, toggleSpotlight)
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.xkddn.rootpass')

  const prefsPath = join(app.getPath('userData'), 'preferences.json')

  let savedVaultFolder = null
  if (fs.existsSync(prefsPath)) {
    try {
      const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
      savedVaultFolder = prefs.vaultPath || null
      if (prefs.shortcut) currentShortcut = prefs.shortcut
      if (prefs.locale) currentLocale = prefs.locale
    } catch (e) {
      console.error('Lecture prefs échouée', e)
    }
  }

  const initialDbPath = savedVaultFolder
    ? path.join(savedVaultFolder, DB_FILENAME)
    : getDefaultDbPath()

  openDatabase(initialDbPath)
  writeLockFile(initialDbPath)

  const lockRefreshInterval = setInterval(refreshLockFile, 60_000)

  ipcMain.handle('auth:isVaultInitialized', () => isVaultInitialized())
  ipcMain.handle('auth:setupMasterPassword', (_, password) => setupMasterPassword(password))
  ipcMain.handle('auth:verifyMasterPassword', (_, password) => verifyMasterPassword(password))
  ipcMain.handle('auth:lock', () => {
    lockVault()
    return true
  })

  ipcMain.handle('accounts:add', (_, accountData) => addAccount(accountData))
  ipcMain.handle('accounts:getAll', () => getAllAccounts())
  ipcMain.handle('accounts:update', (_, id, accountData) => updateAccount(id, accountData))
  ipcMain.handle('accounts:delete', (_, id) => deleteAccount(id))
  ipcMain.handle('accounts:import', (_, accountsData) => importAccounts(accountsData))
  ipcMain.handle('accounts:toggle-favorite', (_, id, currentStatus) =>
    toggleFavorite(id, currentStatus)
  )

  ipcMain.handle('vault:export-encrypted', async (_, password) => {
    const valid = await verifyMasterPassword(password)
    if (!valid) return { error: 'wrong_password' }

    const payload = exportEncryptedVault(password)

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: mt('exportEncTitle'),
      defaultPath: 'rootpass-backup.enc',
      buttonLabel: mt('export'),
      filters: [
        { name: mt('rootpassBackup'), extensions: ['enc'] },
        { name: mt('allFiles'), extensions: ['*'] }
      ]
    })
    if (canceled || !filePath) return { canceled: true }

    fs.writeFileSync(filePath, JSON.stringify(payload))
    return { success: true }
  })

  ipcMain.handle('vault:import-encrypted', async (_, password) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: mt('importEncTitle'),
      buttonLabel: mt('import'),
      filters: [
        { name: mt('rootpassBackup'), extensions: ['enc'] },
        { name: mt('allFiles'), extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (canceled || !filePaths.length) return { canceled: true }

    let payload
    try {
      payload = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'))
    } catch {
      return { error: 'invalid_file' }
    }

    return importEncryptedVault(payload, password)
  })

  ipcMain.handle('accounts:export', async () => {
    try {
      const accounts = getAllAccounts()
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: [mt('cancel'), mt('exportAnyway')],
        defaultId: 0,
        cancelId: 0,
        title: mt('exportWarnTitle'),
        message: mt('exportWarnMessage'),
        detail: mt('exportWarnDetail')
      })
      if (response !== 1) return false

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: mt('saveVaultTitle'),
        defaultPath: 'vault_backup.json',
        buttonLabel: mt('save'),
        filters: [
          { name: mt('jsonFiles'), extensions: ['json'] },
          { name: mt('allFiles'), extensions: ['*'] }
        ]
      })
      if (!canceled && filePath) {
        fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2))
        return true
      }
      return false
    } catch (error) {
      console.error("Erreur critique lors de l'export :", error)
      return false
    }
  })

  let clipboardClearTimer = null
  ipcMain.handle('system:copy', (_, text) => {
    clipboard.writeText(text)
    if (clipboardClearTimer) clearTimeout(clipboardClearTimer)
    clipboardClearTimer = setTimeout(
      () => {
        if (clipboard.readText() === text) clipboard.writeText('')
        clipboardClearTimer = null
      },
      2 * 60 * 1000
    )
    return true
  })
  ipcMain.handle('system:paste', () => clipboard.readText())

  ipcMain.handle('get-autostart', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('set-autostart', (_event, enable) => {
    app.setLoginItemSettings({ openAtLogin: enable, args: enable ? ['hidden'] : [] })
    return enable
  })

  ipcMain.handle('get-locale', () => currentLocale)
  ipcMain.handle('set-locale', (_event, locale) => {
    currentLocale = locale === 'en' ? 'en' : 'fr'
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.locale = currentLocale
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    if (tray) tray.setToolTip(mt('trayTooltip'))
    return currentLocale
  })

  ipcMain.handle('get-autolock', () => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    return prefs.autoLockTime !== undefined ? prefs.autoLockTime : 15
  })
  ipcMain.handle('set-autolock', (_event, time) => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.autoLockTime = time
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return true
  })

  ipcMain.handle('vault:getPath', () => getCurrentDbPath())

  ipcMain.handle('vault:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: mt('chooseSyncFolder'),
      buttonLabel: mt('useThisFolder'),
      properties: ['openDirectory']
    })
    if (canceled || !filePaths.length) return null
    return filePaths[0]
  })

  ipcMain.handle('vault:setPath', async (_, newFolder) => {
    const newDbPath = path.join(newFolder, DB_FILENAME)
    const currentPath = getCurrentDbPath()
    const dbExistsAtTarget = fs.existsSync(newDbPath)

    if (!dbExistsAtTarget) {
      fs.copyFileSync(currentPath, newDbPath)
    }

    removeLockFile(currentPath)

    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.vaultPath = newFolder
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))

    const otherHost = checkLockFile(newDbPath)

    openDatabase(newDbPath)
    writeLockFile(newDbPath)

    if (dbExistsAtTarget) lockVault()

    mainWindow.webContents.send('vault:path-changed', {
      newPath: newDbPath,
      wasExisting: dbExistsAtTarget,
      otherHostWarning: otherHost
    })

    return { success: true, wasExisting: dbExistsAtTarget, otherHostWarning: otherHost }
  })

  ipcMain.handle('vault:resetPath', () => {
    const defaultPath = getDefaultDbPath()
    const currentPath = getCurrentDbPath()

    removeLockFile(currentPath)

    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    delete prefs.vaultPath
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))

    openDatabase(defaultPath)
    writeLockFile(defaultPath)
    lockVault()

    mainWindow.webContents.send('vault:path-changed', {
      newPath: defaultPath,
      wasExisting: true,
      otherHostWarning: null
    })

    return defaultPath
  })

  ipcMain.handle('vault:resolveConflicts', () => {
    const currentPath = getCurrentDbPath()
    const conflicts = detectConflictFiles(currentPath)
    const dir = path.dirname(currentPath)
    const deleted = []
    for (const f of conflicts) {
      try {
        fs.unlinkSync(path.join(dir, f))
        deleted.push(f)
      } catch (e) {
        console.error('Impossible de supprimer le conflit :', f, e)
      }
    }
    return deleted
  })

  ipcMain.handle('vault:openFolder', () => {
    shell.openPath(path.dirname(getCurrentDbPath()))
    return true
  })

  ipcMain.handle('vault:checkStatus', () => {
    const currentPath = getCurrentDbPath()
    const defaultPath = getDefaultDbPath()
    const conflicts = detectConflictFiles(currentPath)
    const otherHost = checkLockFile(currentPath)
    const isCustomPath = currentPath !== defaultPath
    const vaultFolder = path.dirname(currentPath)

    return { currentPath, vaultFolder, isCustomPath, conflicts, otherHostWarning: otherHost }
  })

  ipcMain.handle('spotlight:hide', () => {
    isSpotlightActive = false
    mainWindow.hide()
    return true
  })
  ipcMain.handle('spotlight:resize', (_event, height) => {
    if (!isSpotlightActive || !mainWindow) return false
    const h = Math.max(SPOTLIGHT_MIN_HEIGHT, Math.min(SPOTLIGHT_MAX_HEIGHT, Math.round(height)))
    const { x, y } = mainWindow.getBounds()
    mainWindow.setBounds({ x, y, width: SPOTLIGHT_WIDTH, height: h }, false)
    return true
  })

  ipcMain.handle('get-shortcut', () => currentShortcut)
  ipcMain.handle('set-shortcut', (_event, newShortcut) => {
    currentShortcut = newShortcut
    registerSpotlightShortcut()
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.shortcut = currentShortcut
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return currentShortcut
  })

  const triggerLock = () => {
    if (mainWindow) {
      mainWindow.webContents.send('system-lock')
      if (isSpotlightActive) mainWindow.hide()
    }
  }

  powerMonitor.on('lock-screen', triggerLock)

  powerMonitor.on('suspend', () => {
    removeLockFile(getCurrentDbPath())
    triggerLock()
  })

  powerMonitor.on('resume', () => {
    writeLockFile(getCurrentDbPath())
    if (mainWindow) {
      mainWindow.webContents.send('vault:resumed')
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  initAutoUpdater({
    getWindow: () => mainWindow,
    onBeforeInstall: () => {
      isQuitting = true
    }
  })

  mainWindow.once('ready-to-show', () => {
    const conflicts = detectConflictFiles(getCurrentDbPath())
    if (conflicts.length > 0) {
      mainWindow.webContents.send('vault:conflicts-detected', conflicts)
    }
    const otherHost = checkLockFile(getCurrentDbPath())
    if (otherHost) {
      mainWindow.webContents.send('vault:other-host-warning', otherHost)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: mt('trayOpen'),
      click: () => {
        isSpotlightActive = false
        mainWindow.setFullScreen(false)
        mainWindow.setSize(1300, 730)
        mainWindow.setMenuBarVisibility(true)
        mainWindow.center()
        mainWindow.show()
        mainWindow.webContents.send('toggle-spotlight', false)
      }
    },
    { type: 'separator' },
    {
      label: mt('trayQuit'),
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip(mt('trayTooltip'))
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow.setFullScreen(false)
    mainWindow.setSize(1300, 730)
    mainWindow.center()
    mainWindow.show()
  })

  registerSpotlightShortcut()

  app.on('will-quit', () => {
    clearInterval(lockRefreshInterval)
    removeLockFile(getCurrentDbPath())
    closeDatabase()
    globalShortcut.unregisterAll()
  })
})
