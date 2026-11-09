import 'flag-icons/css/flag-icons.min.css'
import '@fontsource-variable/figtree/wght.css'
import './assets/main.css'
import './i18n/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import SpotlightWindow from './components/SpotlightWindow'
import AutofillSelector from './components/AutofillSelector'
import { applyTheme, getStoredTheme, normalizeTheme } from './theme'

const isMainWindow = !window.api?.isPickerWindow && !window.api?.isSpotlightWindow

if (isMainWindow) {
  applyTheme(getStoredTheme())
  window.api?.getTheme?.().then((saved) => applyTheme(normalizeTheme(saved))).catch(() => {})
}

if (window.api?.isSpotlightWindow) {
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
}

const Root = window.api?.isPickerWindow
  ? AutofillSelector
  : window.api?.isSpotlightWindow
    ? SpotlightWindow
    : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
