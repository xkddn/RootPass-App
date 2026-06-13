import { contextBridge, ipcRenderer } from 'electron'

const api = {
  isVaultInitialized: () => ipcRenderer.invoke('auth:isVaultInitialized'),
  setupMasterPassword: (password) => ipcRenderer.invoke('auth:setupMasterPassword', password),
  verifyMasterPassword: (password) => ipcRenderer.invoke('auth:verifyMasterPassword', password),
  addAccount: (accountData) => ipcRenderer.invoke('accounts:add', accountData),
  getAllAccounts: () => ipcRenderer.invoke('accounts:getAll'),
  lockVault: () => ipcRenderer.invoke('auth:lock'),
  getMasterHint: () => ipcRenderer.invoke('auth:getMasterHint'),
  setMasterHint: (hint) => ipcRenderer.invoke('auth:setMasterHint', hint),
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
  isSpotlightWindow: new URLSearchParams(window.location.search).get('spotlight') === '1',
  hideSpotlight: () => ipcRenderer.invoke('spotlight:hide'),
  resizeSpotlight: (height) => ipcRenderer.invoke('spotlight:resize', height),
  openAddAccountFromSpotlight: () => ipcRenderer.invoke('spotlight:openAddAccount'),
  onSpotlightShow: (callback) => {
    ipcRenderer.on('spotlight-show', callback)
    return () => ipcRenderer.removeListener('spotlight-show', callback)
  },
  onOpenAddAccount: (callback) => {
    ipcRenderer.on('open-add-account', callback)
    return () => ipcRenderer.removeListener('open-add-account', callback)
  },
  getShortcut: () => ipcRenderer.invoke('get-shortcut'),
  setShortcut: (shortcut) => ipcRenderer.invoke('set-shortcut', shortcut),

  isPickerWindow: new URLSearchParams(window.location.search).get('picker') === '1',
  getAutofillStatus: () => ipcRenderer.invoke('autofill:getStatus'),
  setAutofillEnabled: (enabled) => ipcRenderer.invoke('autofill:setEnabled', enabled),
  setAutofillShortcut: (shortcut) => ipcRenderer.invoke('autofill:setShortcut', shortcut),
  fillAutofill: (id, mode) => ipcRenderer.invoke('autofill:fill', id, mode),
  cancelAutofill: () => ipcRenderer.invoke('autofill:cancel'),
  getActiveDomain: () => ipcRenderer.invoke('autofill:getActiveDomain'),
  onSelectorShow: (callback) => {
    ipcRenderer.on('selector-show', callback)
    return () => ipcRenderer.removeListener('selector-show', callback)
  },
  getBridgeStatus: () => ipcRenderer.invoke('bridge:getStatus'),
  getBridgePairingCode: () => ipcRenderer.invoke('bridge:getPairingCode'),
  revokeBridge: (extId) => ipcRenderer.invoke('bridge:revoke', extId),
  setBridgeAutoSubmit: (value) => ipcRenderer.invoke('bridge:setAutoSubmit', value),
  setBridgeEnabled: (enabled) => ipcRenderer.invoke('bridge:setEnabled', enabled),
  onBridgeStatus: (callback) => {
    const handler = (_event, status) => callback(status)
    ipcRenderer.on('bridge:status', handler)
    return () => ipcRenderer.removeListener('bridge:status', handler)
  },
  onAccountsChanged: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('vault:accountsChanged', handler)
    return () => ipcRenderer.removeListener('vault:accountsChanged', handler)
  },

  getNotifications: (extraIds) => ipcRenderer.invoke('notifications:get', extraIds),
  markNotificationRead: (id) => ipcRenderer.invoke('notifications:markRead', id),
  markAllNotificationsRead: (extraIds) => ipcRenderer.invoke('notifications:markAllRead', extraIds),

  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enable) => ipcRenderer.invoke('set-autostart', enable),
  getAutoLock: () => ipcRenderer.invoke('get-autolock'),
  setAutoLock: (time) => ipcRenderer.invoke('set-autolock', time),
  getLocale: () => ipcRenderer.invoke('get-locale'),
  setLocale: (locale) => ipcRenderer.invoke('set-locale', locale),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
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

  getFolders: () => ipcRenderer.invoke('folders:getAll'),
  addFolder: (name, parentId) => ipcRenderer.invoke('folders:add', name, parentId),
  updateFolder: (id, name) => ipcRenderer.invoke('folders:update', id, name),
  deleteFolder: (id) => ipcRenderer.invoke('folders:delete', id),
  reorderFolders: (orderedIds) => ipcRenderer.invoke('folders:reorder', orderedIds),

  getOnboardingDone: () => ipcRenderer.invoke('get-onboarding'),
  setOnboardingDone: () => ipcRenderer.invoke('set-onboarding-complete'),
  resetOnboarding: () => ipcRenderer.invoke('reset-onboarding'),

  getPatchNotesLastSeen: () => ipcRenderer.invoke('patchnotes:getLastSeen'),
  markPatchNotesSeen: (version) => ipcRenderer.invoke('patchnotes:markSeen', version),

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
