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
    lockedBody: "Déverrouillez l'application RootPass pour continuer.",
    appNotFound: 'Application RootPass introuvable. Lancez RootPass puis rouvrez ce popup.',
    openSite: 'Ouvrez un site web pour voir vos comptes.',
    searching: 'Recherche…',
    notConnectedBody: 'Non connecté à RootPass.',
    noAccountsFor: 'Aucun compte pour',
    contentLoading: 'Recherche des comptes…',
    contentLockedTitle: 'Coffre verrouillé',
    contentLocked: "Déverrouillez l'application RootPass pour remplir ce formulaire.",
    contentNotConnectedTitle: 'RootPass non connecté',
    contentNotConnected: "Ouvrez l'application et appairez l'extension.",
    contentNoAccountsTitle: 'Aucun compte pour ce site',
    contentNoAccounts: 'Connectez-vous normalement, RootPass proposera de l’enregistrer.',
    contentAccountsForSite: 'Comptes pour ce site',
    noLogin: 'Sans identifiant',
    kbdNavigate: 'naviguer',
    kbdFill: 'remplir',
    kbdClose: 'fermer',
    close: 'Fermer',
    saveTitle: 'Enregistrer ce mot de passe ?',
    saveLead: 'Retrouvez-le dans RootPass et remplissez-le en un clic.',
    saveBtn: 'Enregistrer',
    updateTitle: 'Mettre à jour le mot de passe ?',
    updateLead: 'Le mot de passe de « {name} » a changé.',
    updateBtn: 'Mettre à jour',
    linkTitle: 'Associer ce site à votre compte ?',
    linkLead: '« {name} » n’a pas encore d’adresse web. RootPass l’associera à {site}.',
    linkBtn: 'Associer',
    linkedMsg: 'Site associé au compte',
    saveNotNow: 'Plus tard',
    saveNever: 'Jamais ici',
    saving: 'Enregistrement…',
    savedMsg: 'Enregistré dans RootPass',
    updatedMsg: 'Mot de passe mis à jour',
    saveErrLocked: 'Déverrouillez RootPass puis réessayez.',
    saveErr: "Échec de l'enregistrement. Réessayez.",
    tagline: 'Vos mots de passe, en local',
    pairTitle: "Connecter l'extension",
    pairStep1: 'Ouvrez RootPass',
    pairStep2: 'Réglages → Extension navigateur',
    pairStep3: "Cliquez « Connecter l'extension » et saisissez le code",
    lockedTitle: 'Coffre verrouillé',
    offlineTitle: 'Application introuvable',
    accountsCount1: '1 compte',
    accountsCountN: '{n} comptes',
    noAccountsTitle: 'Aucun compte pour ce site',
    noAccountsBody: 'Connectez-vous normalement, RootPass proposera de l’enregistrer.',
    openSiteTitle: 'Aucun site ouvert',
    copyLogin: "Copier l'identifiant",
    copyPassword: 'Copier le mot de passe',
    copied: 'Copié',
    fill: 'Remplir',
    savePaused: 'Enregistrement désactivé pour ce site',
    resume: 'Réactiver',
    browserPmTitle: 'Désactiver le gestionnaire du navigateur',
    browserPmDesc: 'Évite que ses suggestions recouvrent celles de RootPass.',
    browserPmOn:
      'Les mots de passe déjà enregistrés dans le navigateur peuvent encore être suggérés. Supprimez-les pour ne garder que RootPass.',
    browserPmPolicy: 'Réglage verrouillé par votre organisation.',
    browserPmOther: 'Réglage déjà contrôlé par une autre extension.',
    browserPmDenied: "Autorisation refusée, rien n'a été modifié."
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
    lockedBody: 'Unlock the RootPass app to continue.',
    appNotFound: 'RootPass app not found. Launch RootPass then reopen this popup.',
    openSite: 'Open a website to see your accounts.',
    searching: 'Searching…',
    notConnectedBody: 'Not connected to RootPass.',
    noAccountsFor: 'No account for',
    contentLoading: 'Looking for accounts…',
    contentLockedTitle: 'Vault locked',
    contentLocked: 'Unlock the RootPass app to fill this form.',
    contentNotConnectedTitle: 'RootPass not connected',
    contentNotConnected: 'Open the app and pair the extension.',
    contentNoAccountsTitle: 'No account for this site',
    contentNoAccounts: 'Sign in as usual, RootPass will offer to save it.',
    contentAccountsForSite: 'Accounts for this site',
    noLogin: 'No username',
    kbdNavigate: 'navigate',
    kbdFill: 'fill',
    kbdClose: 'close',
    close: 'Close',
    saveTitle: 'Save this password?',
    saveLead: 'Find it in RootPass and fill it in one click.',
    saveBtn: 'Save',
    updateTitle: 'Update the password?',
    updateLead: 'The password for “{name}” has changed.',
    updateBtn: 'Update',
    linkTitle: 'Link this site to your account?',
    linkLead: '“{name}” has no web address yet. RootPass will link it to {site}.',
    linkBtn: 'Link',
    linkedMsg: 'Site linked to the account',
    saveNotNow: 'Later',
    saveNever: 'Never here',
    saving: 'Saving…',
    savedMsg: 'Saved to RootPass',
    updatedMsg: 'Password updated',
    saveErrLocked: 'Unlock RootPass and try again.',
    saveErr: 'Could not save. Try again.',
    tagline: 'Your passwords, kept local',
    pairTitle: 'Connect the extension',
    pairStep1: 'Open RootPass',
    pairStep2: 'Settings → Browser extension',
    pairStep3: 'Click “Connect the extension” and enter the code',
    lockedTitle: 'Vault locked',
    offlineTitle: 'App not found',
    accountsCount1: '1 account',
    accountsCountN: '{n} accounts',
    noAccountsTitle: 'No account for this site',
    noAccountsBody: 'Sign in as usual, RootPass will offer to save it.',
    openSiteTitle: 'No website open',
    copyLogin: 'Copy username',
    copyPassword: 'Copy password',
    copied: 'Copied',
    fill: 'Fill',
    savePaused: 'Saving is turned off for this site',
    resume: 'Turn on',
    browserPmTitle: "Turn off the browser's password manager",
    browserPmDesc: 'Stops its suggestions from covering RootPass.',
    browserPmOn:
      'Passwords already saved in the browser may still be suggested. Delete them to keep only RootPass.',
    browserPmPolicy: 'This setting is locked by your organization.',
    browserPmOther: 'This setting is already controlled by another extension.',
    browserPmDenied: 'Permission denied, nothing was changed.'
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
globalThis.rpGetLocale = () => rpLocale
globalThis.rpInitI18n = rpInitI18n
