import { tmpdir } from 'os'

// Mock complet du module 'electron' pour les tests Node.js
// Utilisé via l'alias vitest.config.js → resolve.alias.electron

export const app = {
  getPath: () => tmpdir(),
  getAppPath: () => tmpdir(),
  isPackaged: false,
  getName: () => 'rootpass',
  getVersion: () => '1.0.0',
  on: () => {},
  whenReady: () => Promise.resolve(),
  quit: () => {},
  setAppUserModelId: () => {}
}

export const ipcMain = {
  handle: () => {},
  on: () => {},
  removeHandler: () => {}
}

export class BrowserWindow {
  constructor() {
    this.webContents = { openDevTools: () => {}, on: () => {}, send: () => {} }
  }
  loadURL() {}
  loadFile() {}
  on() {}
  show() {}
  hide() {}
  close() {}
  isVisible() {
    return false
  }
  isDestroyed() {
    return false
  }
}

export const Menu = {
  buildFromTemplate: () => ({}),
  setApplicationMenu: () => {}
}

export class Tray {
  setToolTip() {}
  setContextMenu() {}
  on() {}
}

export const shell = { openExternal: () => Promise.resolve() }
export const globalShortcut = { register: () => true, unregisterAll: () => {} }
export const nativeImage = { createFromPath: () => ({ isEmpty: () => false }) }
export const dialog = { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) }
export const clipboard = { writeText: () => {}, readText: () => '' }
export const nativeTheme = { themeSource: 'system' }
export const screen = {
  getPrimaryDisplay: () => ({ workAreaSize: { width: 1920, height: 1080 } })
}
