import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import fr from './fr.json'

i18n.use(initReactI18next).init({
  resources: {
    en: en,
    fr: fr
  },
  lng: 'fr',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

if (typeof window !== 'undefined' && window.api?.getLocale) {
  window.api
    .getLocale()
    .then((loc) => {
      if (loc && loc !== i18n.language) i18n.changeLanguage(loc)
    })
    .catch(() => {})
}

export default i18n

