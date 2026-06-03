// Imports CSS tiers via JS (et non via @import dans main.css) : Tailwind v4
// avale les @import et casse la copie des assets (polices/drapeaux) au build.
// Importés ici, Vite réécrit les url() et émet bien les fichiers .woff/.svg.
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
