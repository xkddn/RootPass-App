const rpApi = globalThis.browser || globalThis.chrome

const RP_MESSAGES = {
  fr: {
    appName: 'RootPass',
    footLocal: 'Tout reste en local sur votre machine.',
    forget: 'Oublier',
    connecting: 'Connexion…',
    pairIntro:
      "Ouvrez RootPass, allez dans Réglages → Extension navigateur, cliquez « Connecter l'extension », puis saisissez le code ci-dessous.",
    pairButton: 'Appairer',
    pairing: 'Appairage…',
    errBadCode: 'Code incorrect.',
    errExpired: 'Code expiré. Générez-en un nouveau.',
    errPairFailed: "Échec de l'appairage. Réessayez.",
    statusConnected: 'Connectée',
    statusNotConnected: 'Non connectée',
    statusOffline: 'Hors ligne',
    statusLocked: 'Verrouillé',
    lockedBody: "Coffre RootPass verrouillé. Déverrouillez l'application pour continuer.",
    appNotFound: 'Application RootPass introuvable. Lancez RootPass puis rouvrez ce popup.',
    openSite: 'Ouvrez un site web pour voir vos comptes.',
    searching: 'Recherche…',
    notConnectedBody: 'Non connecté à RootPass.',
    noAccountsFor: 'Aucun compte pour',
    contentLoading: 'RootPass…',
    contentLocked: "Coffre RootPass verrouillé. Déverrouillez l'application.",
    contentNotConnected: "RootPass non connecté. Ouvrez l'application et appairez l'extension.",
    contentNoAccounts: 'Aucun compte pour ce site.',
    contentAccountsForSite: 'Comptes pour ce site',
    saveTitle: 'Enregistrer ce mot de passe dans RootPass ?',
    saveBtn: 'Enregistrer',
    saveNotNow: 'Pas maintenant',
    saveNever: 'Jamais pour ce site'
  },
  en: {
    appName: 'RootPass',
    footLocal: 'Everything stays local on your machine.',
    forget: 'Forget',
    connecting: 'Connecting…',
    pairIntro:
      'Open RootPass, go to Settings → Browser extension, click "Connect the extension", then enter the code below.',
    pairButton: 'Pair',
    pairing: 'Pairing…',
    errBadCode: 'Wrong code.',
    errExpired: 'Code expired. Generate a new one.',
    errPairFailed: 'Pairing failed. Try again.',
    statusConnected: 'Connected',
    statusNotConnected: 'Not connected',
    statusOffline: 'Offline',
    statusLocked: 'Locked',
    lockedBody: 'RootPass vault is locked. Unlock the app to continue.',
    appNotFound: 'RootPass app not found. Launch RootPass then reopen this popup.',
    openSite: 'Open a website to see your accounts.',
    searching: 'Searching…',
    notConnectedBody: 'Not connected to RootPass.',
    noAccountsFor: 'No account for',
    contentLoading: 'RootPass…',
    contentLocked: 'RootPass vault is locked. Unlock the app.',
    contentNotConnected: 'RootPass not connected. Open the app and pair the extension.',
    contentNoAccounts: 'No account for this site.',
    contentAccountsForSite: 'Accounts for this site',
    saveTitle: 'Save this password to RootPass?',
    saveBtn: 'Save',
    saveNotNow: 'Not now',
    saveNever: 'Never for this site'
  }
}

function rpDefaultLocale() {
  try {
    const ui = rpApi.i18n.getUILanguage ? rpApi.i18n.getUILanguage() : ''
    if (ui && ui.toLowerCase().startsWith('fr')) return 'fr'
  } catch {
    void 0
  }
  return 'en'
}

let rpLocale = rpDefaultLocale()

function rpSetLocale(locale) {
  if (locale === 'fr' || locale === 'en') rpLocale = locale
}

function t(key) {
  const table = RP_MESSAGES[rpLocale] || RP_MESSAGES.en
  if (table[key]) return table[key]
  try {
    return rpApi.i18n.getMessage(key) || key
  } catch {
    return key
  }
}

async function rpInitI18n() {
  try {
    const data = await rpApi.storage.local.get('appLocale')
    if (data && (data.appLocale === 'fr' || data.appLocale === 'en')) {
      rpLocale = data.appLocale
      return
    }
  } catch {
    void 0
  }
  try {
    const res = await rpApi.runtime.sendMessage({ cmd: 'getLocale' })
    if (res && (res.locale === 'fr' || res.locale === 'en')) rpLocale = res.locale
  } catch {
    void 0
  }
}

globalThis.t = t
globalThis.rpSetLocale = rpSetLocale
globalThis.rpInitI18n = rpInitI18n
