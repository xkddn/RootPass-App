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
  importEncryptedVault,
  backfillMissingUrls
} from './accounts.js'
import { getFolders, addFolder, updateFolder, deleteFolder, reorderFolders } from './folders.js'
import { openDatabase, getCurrentDbPath, getDefaultDbPath, closeDatabase } from './database.js'
import {
  lockVault,
  isVaultInitialized,
  isVaultUnlocked,
  setupMasterPassword,
  verifyMasterPassword,
  getMasterHint,
  setMasterHint
} from './auth.js'
import {
  writeLockFile,
  removeLockFile,
  checkLockFile,
  detectConflictFiles,
  mt as _mt
} from './helpers.js'
import { initAutoUpdater } from './updater.js'
import {
  startBridge,
  stopBridge,
  getStatus as getBridgeStatus,
  generatePairingCode,
  revokePairing,
  setBridgeLocale,
  setBridgeAutoSubmit
} from './bridge.js'
import {
  isAutofillSupported,
  readActiveBrowserUrl,
  readAnyBrowserUrl,
  getForegroundWindow,
  typeCredentials,
  extractDomain
} from './autofill.js'

const DB_FILENAME = 'vault_V2.db'

let tray = null
let mainWindow = null
let spotlightWindow = null
let selectorWindow = null
let isQuitting = false
let currentShortcut = 'CommandOrControl+Shift+P'
let currentLocale = 'fr'
let currentTheme = 'dark'
let autofillShortcut = 'CommandOrControl+Shift+V'
let autofillEnabled = true
let bridgeEnabled = true
let pendingAutofill = null

const NOTIFICATION_CATALOG = [{ id: 'autofill-intro' }]

function getNotificationState(prefsPath, extraIds = []) {
  let read = []
  try {
    if (fs.existsSync(prefsPath)) {
      read = JSON.parse(fs.readFileSync(prefsPath, 'utf-8')).notificationsRead || []
    }
  } catch (e) {
    console.error('Lecture etat notifications echouee', e)
  }
  const readSet = new Set(read)
  const ids = [...NOTIFICATION_CATALOG.map((n) => n.id), ...extraIds]
  const items = ids.map((id) => ({ id, read: readSet.has(id) }))
  return { items, unreadCount: items.filter((i) => !i.read).length }
}

const mt = (key) => _mt(key, currentLocale)

function refreshLockFile() {
  writeLockFile(getCurrentDbPath())
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 730,
    show: false,
    backgroundColor: '#08080a',
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

  mainWindow.webContents.once('dom-ready', () => {
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
const SPOTLIGHT_WIDTH = 730
const SPOTLIGHT_BASE_HEIGHT = 240
const SPOTLIGHT_MAX_HEIGHT = 560

function createSpotlightWindow() {
  spotlightWindow = new BrowserWindow({
    width: SPOTLIGHT_WIDTH,
    height: SPOTLIGHT_BASE_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  spotlightWindow.on('blur', () => {
    spotlightWindow.hide()
  })

  spotlightWindow.on('closed', () => {
    spotlightWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    spotlightWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?spotlight=1')
  } else {
    spotlightWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { spotlight: '1' }
    })
  }
}

function showSpotlight() {
  if (!spotlightWindow) createSpotlightWindow()
  const { workArea } = screen.getPrimaryDisplay()
  const x = Math.round(workArea.x + (workArea.width - SPOTLIGHT_WIDTH) / 2)
  const y = Math.round(workArea.y + workArea.height * 0.18)
  spotlightWindow.setPosition(x, y)
  spotlightWindow.setBounds({ x, y, width: SPOTLIGHT_WIDTH, height: SPOTLIGHT_BASE_HEIGHT })
  spotlightWindow.show()
  spotlightWindow.focus()
  spotlightWindow.webContents.send('spotlight-show')
}

function toggleSpotlight() {
  if (!isVaultUnlocked()) {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
    return
  }

  if (spotlightWindow && spotlightWindow.isVisible()) {
    spotlightWindow.hide()
  } else {
    showSpotlight()
  }
}

const SELECTOR_WIDTH = 560
const SELECTOR_HEIGHT = 460

function createSelectorWindow() {
  selectorWindow = new BrowserWindow({
    width: SELECTOR_WIDTH,
    height: SELECTOR_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  selectorWindow.on('blur', () => {
    selectorWindow.hide()
    pendingAutofill = null
  })
  selectorWindow.on('closed', () => {
    selectorWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    selectorWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?picker=1')
  } else {
    selectorWindow.loadFile(join(__dirname, '../renderer/index.html'), { query: { picker: '1' } })
  }
}

async function triggerAutofill() {
  if (!isAutofillSupported || !autofillEnabled) return

  if (!isVaultUnlocked()) {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
    return
  }

  if (!selectorWindow) createSelectorWindow()

  const fg = await getForegroundWindow()
  pendingAutofill = { hwnd: fg && fg.hwnd ? fg.hwnd : 0 }

  const { workArea } = screen.getPrimaryDisplay()
  const x = Math.round(workArea.x + (workArea.width - SELECTOR_WIDTH) / 2)
  const y = Math.round(workArea.y + workArea.height * 0.2)
  selectorWindow.setBounds({ x, y, width: SELECTOR_WIDTH, height: SELECTOR_HEIGHT })
  selectorWindow.show()
  selectorWindow.focus()

  const send = () => selectorWindow.webContents.send('selector-show')
  if (selectorWindow.webContents.isLoading()) {
    selectorWindow.webContents.once('did-finish-load', send)
  } else {
    send()
  }
}

function registerSpotlightShortcut() {
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(currentShortcut, toggleSpotlight)
  if (!ok) {
    currentShortcut = DEFAULT_SHORTCUT
    globalShortcut.register(DEFAULT_SHORTCUT, toggleSpotlight)
  }
  if (isAutofillSupported && autofillEnabled && autofillShortcut !== currentShortcut) {
    globalShortcut.register(autofillShortcut, triggerAutofill)
  }
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  electronApp.setAppUserModelId('com.xkddn.rootpass')

  const prefsPath = join(app.getPath('userData'), 'preferences.json')

  let savedVaultFolder = null
  if (fs.existsSync(prefsPath)) {
    try {
      const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
      savedVaultFolder = prefs.vaultPath || null
      if (prefs.shortcut) currentShortcut = prefs.shortcut
      if (prefs.locale) currentLocale = prefs.locale
      if (prefs.autofillShortcut) autofillShortcut = prefs.autofillShortcut
      if (prefs.autofillEnabled !== undefined) autofillEnabled = prefs.autofillEnabled
      if (prefs.bridgeEnabled !== undefined) bridgeEnabled = prefs.bridgeEnabled
      if (prefs.theme) currentTheme = prefs.theme === 'light' ? 'light' : 'dark'
    } catch (e) {
      console.error('Lecture prefs échouée', e)
    }
  }

  const initialDbPath = savedVaultFolder
    ? path.join(savedVaultFolder, DB_FILENAME)
    : getDefaultDbPath()

  openDatabase(initialDbPath)
  writeLockFile(initialDbPath)

  const sendBridgeStatus = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bridge:status', { ...status, enabled: bridgeEnabled })
    }
  }
  const sendAccountsChanged = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('vault:accountsChanged')
    }
  }
  if (bridgeEnabled) {
    startBridge(prefsPath, sendBridgeStatus, sendAccountsChanged)
    setBridgeLocale(currentLocale)
  }

  const lockRefreshInterval = setInterval(refreshLockFile, 60_000)

  ipcMain.handle('auth:isVaultInitialized', () => isVaultInitialized())
  ipcMain.handle('auth:setupMasterPassword', (_, password) => setupMasterPassword(password))
  ipcMain.handle('auth:verifyMasterPassword', async (_, password) => {
    const ok = await verifyMasterPassword(password)
    if (ok) {
      try {
        backfillMissingUrls()
      } catch (e) {
        console.error('Backfill URLs echoue', e)
      }
    }
    return ok
  })
  ipcMain.handle('auth:lock', () => {
    lockVault()
    return true
  })
  ipcMain.handle('auth:getMasterHint', () => getMasterHint())
  ipcMain.handle('auth:setMasterHint', (_, hint) => setMasterHint(hint))

  ipcMain.handle('accounts:add', (_, accountData) => addAccount(accountData))
  ipcMain.handle('accounts:getAll', () => getAllAccounts())
  ipcMain.handle('accounts:update', (_, id, accountData) => updateAccount(id, accountData))
  ipcMain.handle('accounts:delete', (_, id) => deleteAccount(id))
  ipcMain.handle('accounts:import', (_, accountsData) => importAccounts(accountsData))
  ipcMain.handle('accounts:toggle-favorite', (_, id, currentStatus) =>
    toggleFavorite(id, currentStatus)
  )

  ipcMain.handle('folders:getAll', () => getFolders())
  ipcMain.handle('folders:add', (_, name, parentId) => addFolder(name, parentId))
  ipcMain.handle('folders:update', (_, id, name) => updateFolder(id, name))
  ipcMain.handle('folders:delete', (_, id) => deleteFolder(id))
  ipcMain.handle('folders:reorder', (_, orderedIds) => reorderFolders(orderedIds))

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

  ipcMain.handle('get-theme', () => currentTheme)
  ipcMain.handle('set-theme', (_event, theme) => {
    currentTheme = theme === 'light' ? 'light' : 'dark'
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.theme = currentTheme
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return currentTheme
  })

  ipcMain.handle('get-locale', () => currentLocale)
  ipcMain.handle('set-locale', (_event, locale) => {
    currentLocale = locale === 'en' ? 'en' : 'fr'
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.locale = currentLocale
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    if (tray) tray.setToolTip(mt('trayTooltip'))
    setBridgeLocale(currentLocale)
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
    if (spotlightWindow) spotlightWindow.hide()
    return true
  })
  ipcMain.handle('spotlight:resize', (_event, height) => {
    if (!spotlightWindow) return false
    const h = Math.max(SPOTLIGHT_BASE_HEIGHT, Math.min(SPOTLIGHT_MAX_HEIGHT, Math.round(height)))
    const { x, y } = spotlightWindow.getBounds()
    spotlightWindow.setBounds({ x, y, width: SPOTLIGHT_WIDTH, height: h }, false)
    return true
  })
  ipcMain.handle('spotlight:openAddAccount', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('open-add-account')
    }
    if (spotlightWindow) spotlightWindow.hide()
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

  ipcMain.handle('autofill:getStatus', () => ({
    supported: isAutofillSupported,
    enabled: autofillEnabled,
    shortcut: autofillShortcut
  }))
  ipcMain.handle('autofill:setEnabled', (_event, enabled) => {
    autofillEnabled = !!enabled
    registerSpotlightShortcut()
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.autofillEnabled = autofillEnabled
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return autofillEnabled
  })
  ipcMain.handle('autofill:setShortcut', (_event, newShortcut) => {
    if (newShortcut === currentShortcut) return { error: 'conflict', shortcut: autofillShortcut }
    autofillShortcut = newShortcut
    registerSpotlightShortcut()
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.autofillShortcut = autofillShortcut
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return { shortcut: autofillShortcut }
  })
  ipcMain.handle('autofill:getActiveDomain', async () => {
    if (!isAutofillSupported) return null
    let info = await readActiveBrowserUrl()
    if (!info.ok) info = await readAnyBrowserUrl()
    if (!info.ok || !info.url) return null
    return extractDomain(info.url)
  })
  ipcMain.handle('autofill:fill', async (_event, id, mode = 'both') => {
    if (selectorWindow) selectorWindow.hide()
    const pending = pendingAutofill
    pendingAutofill = null
    if (!pending || !isVaultUnlocked()) return false
    let account = null
    try {
      account = getAllAccounts().find((a) => a.id === id)
    } catch {
      return false
    }
    if (!account) return false

    const payload = { hwnd: pending.hwnd }
    if (mode === 'login') payload.login = account.login
    else if (mode === 'password') payload.password = account.password
    else {
      payload.login = account.login
      payload.password = account.password
    }
    await typeCredentials(payload)
    return true
  })
  ipcMain.handle('autofill:cancel', () => {
    pendingAutofill = null
    if (selectorWindow) selectorWindow.hide()
    return true
  })

  ipcMain.handle('bridge:getStatus', () => ({ ...getBridgeStatus(), enabled: bridgeEnabled }))
  ipcMain.handle('bridge:getPairingCode', () => (bridgeEnabled ? generatePairingCode() : null))
  ipcMain.handle('bridge:revoke', (_event, extId) => revokePairing(extId))
  ipcMain.handle('bridge:setAutoSubmit', (_event, value) => {
    setBridgeAutoSubmit(value)
    return { ...getBridgeStatus(), enabled: bridgeEnabled }
  })
  ipcMain.handle('bridge:setEnabled', (_event, enabled) => {
    bridgeEnabled = !!enabled
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.bridgeEnabled = bridgeEnabled
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    if (bridgeEnabled) {
      startBridge(prefsPath, sendBridgeStatus, sendAccountsChanged)
      setBridgeLocale(currentLocale)
    } else stopBridge()
    const status = { ...getBridgeStatus(), enabled: bridgeEnabled }
    sendBridgeStatus(getBridgeStatus())
    return status
  })

  ipcMain.handle('notifications:get', (_event, extraIds) =>
    getNotificationState(prefsPath, extraIds || [])
  )
  ipcMain.handle('notifications:markRead', (_event, id) => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    const set = new Set(prefs.notificationsRead || [])
    set.add(id)
    prefs.notificationsRead = [...set]
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return getNotificationState(prefsPath)
  })
  ipcMain.handle('get-onboarding', () => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    return prefs.onboardingCompleted === true
  })
  ipcMain.handle('set-onboarding-complete', () => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.onboardingCompleted = true
    prefs.lastSeenVersion = app.getVersion()
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return true
  })

  ipcMain.handle('patchnotes:getLastSeen', () => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    return prefs.lastSeenVersion || null
  })
  ipcMain.handle('patchnotes:markSeen', (_event, version) => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.lastSeenVersion = version || app.getVersion()
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return true
  })
  ipcMain.handle('reset-onboarding', () => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    prefs.onboardingCompleted = false
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return true
  })

  ipcMain.handle('notifications:markAllRead', (_event, extraIds) => {
    const prefs = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf-8')) : {}
    const set = new Set(prefs.notificationsRead || [])
    ;[...NOTIFICATION_CATALOG.map((n) => n.id), ...(extraIds || [])].forEach((id) => set.add(id))
    prefs.notificationsRead = [...set]
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
    return getNotificationState(prefsPath, extraIds || [])
  })

  const triggerLock = () => {
    if (mainWindow) mainWindow.webContents.send('system-lock')
    if (spotlightWindow) spotlightWindow.hide()
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
        if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false)
        mainWindow.setSize(1300, 730)
        mainWindow.setMenuBarVisibility(true)
        mainWindow.center()
        mainWindow.show()
        mainWindow.focus()
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
    stopBridge()
    removeLockFile(getCurrentDbPath())
    closeDatabase()
    globalShortcut.unregisterAll()
  })
})
