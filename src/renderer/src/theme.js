import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'rootpass-theme'
const EVENT = 'rootpass-themechange'

export function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme) {
  const next = normalizeTheme(theme)
  document.documentElement.classList.toggle('theme-light', next === 'light')
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  return next
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

function snapshot() {
  return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark'
}

export function useThemeMode() {
  return useSyncExternalStore(subscribe, snapshot, () => 'dark')
}

export function getStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'dark'
  }
}

export function setTheme(theme) {
  const next = applyTheme(theme)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    void 0
  }
  window.api?.setTheme?.(next)
  return next
}
