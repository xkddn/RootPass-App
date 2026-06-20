import 'flag-icons/css/flag-icons.min.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
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
