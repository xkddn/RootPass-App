import { contextBridge, ipcRenderer } from 'electron'

const api = {
  isVaultInitialized: () => ipcRenderer.invoke('auth:isVaultInitialized'),
  setupMasterPassword: (password) => ipcRenderer.invoke('auth:setupMasterPassword', password),
  verifyMasterPassword: (password) => ipcRenderer.invoke('auth:verifyMasterPassword', password),
  addAccount: (accountData) => ipcRenderer.invoke('accounts:add', accountData),
  getAllAccounts: () => ipcRenderer.invoke('accounts:getAll'),
  lockVault: () => ipcRenderer.invoke('auth:lock'),
  updateAccount: (id, accountData) => ipcRenderer.invoke('accounts:update', id, accountData),
  deleteAccount: (id) => ipcRenderer.invoke('accounts:delete', id),
  copyToClipboard: (text) => ipcRenderer.invoke('system:copy', text),
  readClipboard: () => ipcRenderer.invoke('system:paste'),
  importAccounts: (accountsData) => ipcRenderer.invoke('accounts:import', accountsData),
  toggleFavorite: (id, currentStatus) =>
    ipcRenderer.invoke('accounts:toggle-favorite', id, currentStatus),
  exportAccounts: () => ipcRenderer.invoke('accounts:export'),
  exportEncrypted: (password) => ipcRenderer.invoke('vault:export-encrypted', password),
  importEncrypted: (password) => ipcRenderer.invoke('vault:import-encrypted', password),
  onToggleSpotlight: (callback) => {
    const handler = (_event, isSpotlight) => callback(isSpotlight)
    ipcRenderer.on('toggle-spotlight', handler)
    return () => ipcRenderer.removeListener('toggle-spotlight', handler)
  },
  hideSpotlight: () => ipcRenderer.invoke('spotlight:hide'),
  resizeSpotlight: (height) => ipcRenderer.invoke('spotlight:resize', height),
  getShortcut: () => ipcRenderer.invoke('get-shortcut'),
  setShortcut: (shortcut) => ipcRenderer.invoke('set-shortcut', shortcut),
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enable) => ipcRenderer.invoke('set-autostart', enable),
  getAutoLock: () => ipcRenderer.invoke('get-autolock'),
  setAutoLock: (time) => ipcRenderer.invoke('set-autolock', time),
  getLocale: () => ipcRenderer.invoke('get-locale'),
  setLocale: (locale) => ipcRenderer.invoke('set-locale', locale),
  onSystemLock: (callback) => {
    ipcRenderer.removeAllListeners('system-lock')
    ipcRenderer.on('system-lock', callback)
    return () => ipcRenderer.removeListener('system-lock', callback)
  },
  onBackgroundWarning: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('show-background-warning', handler)
    return () => ipcRenderer.removeListener('show-background-warning', handler)
  },
  respondBackgroundWarning: (data) => ipcRenderer.send('background-warning-response', data),

  // Synchro multi-PC
  getVaultPath: () => ipcRenderer.invoke('vault:getPath'),
  selectVaultFolder: () => ipcRenderer.invoke('vault:selectFolder'),
  setVaultPath: (folder) => ipcRenderer.invoke('vault:setPath', folder),
  resetVaultPath: () => ipcRenderer.invoke('vault:resetPath'),
  checkVaultStatus: () => ipcRenderer.invoke('vault:checkStatus'),
  resolveVaultConflicts: () => ipcRenderer.invoke('vault:resolveConflicts'),
  openVaultFolder: () => ipcRenderer.invoke('vault:openFolder'),
  onVaultPathChanged: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('vault:path-changed', handler)
    return () => ipcRenderer.removeListener('vault:path-changed', handler)
  },
  onVaultConflictsDetected: (callback) => {
    const handler = (_event, files) => callback(files)
    ipcRenderer.on('vault:conflicts-detected', handler)
    return () => ipcRenderer.removeListener('vault:conflicts-detected', handler)
  },
  onVaultOtherHostWarning: (callback) => {
    const handler = (_event, host) => callback(host)
    ipcRenderer.on('vault:other-host-warning', handler)
    return () => ipcRenderer.removeListener('vault:other-host-warning', handler)
  },
  onVaultResumed: (callback) => {
    ipcRenderer.on('vault:resumed', callback)
    return () => ipcRenderer.removeListener('vault:resumed', callback)
  },

  // Mises à jour automatiques
  getAppVersion: () => ipcRenderer.invoke('updater:getVersion'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdaterStatus: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
