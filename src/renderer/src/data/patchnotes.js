export const PATCH_NOTES = [
  {
    version: '2.0.0',
    date: '2026-11-09',
    fr: {
      added: [
        'Nouveau design complet : un accueil repensé avec un accès rapide à vos comptes, la santé de votre coffre et une barre latérale pour vos vues et dossiers.',
        'Nouveau logo RootPass, repris partout : application, icônes et extension.',
        'Audit de sécurité : nouvelle section « Comptes en double » pour repérer un même compte enregistré plusieurs fois sur un site.',
        'Extension : quand vous changez de mot de passe sur un site, RootPass propose de le mettre à jour au lieu de créer un nouveau compte.',
        'Extension : un compte sans adresse de site est reconnu par son nom et associé au site, avec votre e-mail, au lieu d’être enregistré en double.',
        'Extension : une option pour désactiver le gestionnaire de mots de passe du navigateur, afin que ses suggestions ne recouvrent plus celles de RootPass.',
        'Spotlight peut être activé ou désactivé dans les réglages, avec un bouton pour le tester.'
      ],
      improved: [
        'Extension entièrement redessinée : une liste de comptes plus claire sous le champ, utilisable au clavier, et une proposition d’enregistrement en haut à droite qui disparaît seule après 10 secondes.',
        'L’icône RootPass dans les champs se place à côté du bouton pour afficher le mot de passe, au lieu de le recouvrir.',
        'Les comptes enregistrés depuis l’extension portent le nom du site (par exemple « Github ») et son adresse principale.',
        'Mises à jour plus simples : RootPass se ferme et se rouvre tout seul après l’installation.',
        'Le code d’appairage de l’extension s’affiche correctement dans les petites fenêtres.',
        'Thèmes clair et sombre plus cohérents dans toute l’application.'
      ],
      removed: [],
      fixed: [
        'L’extension ne propose plus d’enregistrer un mot de passe déjà présent dans votre coffre, y compris sur les connexions en deux étapes.',
        'Cliquer sur le bouton pour afficher le mot de passe ne déclenche plus la proposition d’enregistrement.',
        'La proposition d’enregistrement ne disparaît plus quand le site change de page juste après la connexion.'
      ]
    },
    en: {
      added: [
        'A complete redesign: a new home screen with quick access to your accounts, your vault health and a sidebar for your views and folders.',
        'A new RootPass logo, used everywhere: app, icons and extension.',
        'Security audit: a new “Duplicate accounts” section to spot the same account saved more than once for a site.',
        'Extension: when you change your password on a site, RootPass offers to update it instead of creating a new account.',
        'Extension: an account without a website address is recognized by its name and linked to the site, with your email, instead of being saved twice.',
        'Extension: an option to turn off the browser’s password manager, so its suggestions no longer cover RootPass.',
        'Spotlight can be turned on or off in the settings, with a button to try it out.'
      ],
      improved: [
        'A fully redesigned extension: a clearer account list under the field that works with the keyboard, and a save prompt at the top right that closes on its own after 10 seconds.',
        'The RootPass icon in fields now sits next to the show password button instead of covering it.',
        'Accounts saved from the extension get the site’s name (for example “Github”) and its main address.',
        'Easier updates: RootPass closes and reopens on its own after installing.',
        'The extension pairing code now displays correctly in small windows.',
        'More consistent light and dark themes across the whole app.'
      ],
      removed: [],
      fixed: [
        'The extension no longer offers to save a password that is already in your vault, including on two step sign-ins.',
        'Clicking the show password button no longer triggers the save prompt.',
        'The save prompt no longer disappears when the site changes page right after you sign in.'
      ]
    }
  },
  {
    version: '1.4.1',
    date: '2026-06-20',
    fr: {
      added: [
        'Notes sécurisées : enregistrez des informations sensibles (codes, phrases de récupération, numéros) chiffrées comme le reste de votre coffre.',
        'Import de comptes depuis un fichier CSV, avec un nouvel onglet dédié pour reconnaître automatiquement vos colonnes.',
        'Complétion automatique des adresses de sites : commencez à taper un nom et RootPass propose l’adresse complète, sans connexion internet.',
        'Tri du tableau de bord par titre, date d’ajout ou dernière modification.',
        'Onglet dédié aux comptes sans adresse de site, pour les repérer et les compléter facilement.'
      ],
      improved: [
        'Menu adapté aux petites fenêtres : un menu se replie automatiquement pour rester lisible.',
        'Ouverture et fermeture des fenêtres plus douces, avec de nouvelles animations.',
        'Fermez une fenêtre en cliquant simplement à côté.',
        'Thème clair plus lisible : meilleurs contrastes et grille de comptes plus nette.'
      ],
      removed: [],
      fixed: []
    },
    en: {
      added: [
        'Secure notes: store sensitive information (codes, recovery phrases, numbers) encrypted just like the rest of your vault.',
        'Import accounts from a CSV file, with a new dedicated tab that recognizes your columns automatically.',
        'Automatic website address completion: start typing a name and RootPass suggests the full address, no internet needed.',
        'Sort the dashboard by title, date added or last change.',
        'A dedicated tab for accounts without a website address, so you can spot and complete them easily.'
      ],
      improved: [
        'Menu that adapts to small windows: it collapses automatically to stay readable.',
        'Smoother window opening and closing, with new animations.',
        'Close a window by simply clicking next to it.',
        'More readable light theme: better contrast and a cleaner account grid.'
      ],
      removed: [],
      fixed: []
    }
  },
  {
    version: '1.4.0',
    date: '2026-06-18',
    fr: {
      added: [
        'Changement du mot de passe maître directement depuis les réglages : toutes vos données sont automatiquement re-chiffrées avec la nouvelle clé.',
        'Aperçu d’un compte : cliquez sur un compte pour voir ses détails dans un panneau latéral, avec copie en un clic du login, du mot de passe et du code 2FA.',
        'Notification à chaque nouvelle mise à jour, pour découvrir les nouveautés en un coup d’œil.'
      ],
      improved: [
        'Sécurité renforcée : le titre, la catégorie, les étiquettes et les noms de dossiers sont désormais chiffrés eux aussi.',
        'Réglages réorganisés en sections claires (Général, Productivité, Sécurité, Synchronisation, Autre) pour s’y retrouver plus vite.',
        'Page de synchronisation plus claire : un rappel explique que les méthodes sont des alternatives et qu’il suffit d’en choisir une.',
        'Extension navigateur : elle se reconnecte automatiquement dès que vous l’utilisez, sans manipulation.'
      ],
      removed: [],
      fixed: ['Correction du changement de mot de passe maître, qui pouvait échouer dans certains cas.']
    },
    en: {
      added: [
        'Change your master password directly from settings: all your data is automatically re-encrypted with the new key.',
        'Account preview: click an account to see its details in a side panel, with one-click copy of the login, password and 2FA code.',
        'A notification on every new update so you can discover what’s new at a glance.'
      ],
      improved: [
        'Stronger security: the title, category, tags and folder names are now encrypted too.',
        'Settings reorganized into clear sections (General, Productivity, Security, Sync, Other) so you find things faster.',
        'Clearer sync page: a hint explains the methods are alternatives and you only need to pick one.',
        'Browser extension: it reconnects automatically as soon as you use it, with nothing to do.'
      ],
      removed: [],
      fixed: ['Fixed master password change, which could fail in some cases.']
    }
  },
  {
    version: '1.3.1',
    date: '2026-06-13',
    fr: {
      added: [
        'Visite guidée au premier lancement pour configurer RootPass pas à pas, avec une phrase de rappel pour ne jamais oublier votre mot de passe maître.',
        'Extension navigateur (Chrome et Firefox) pour remplir vos identifiants directement sur les sites web.',
        'Thème clair et thème sombre, au choix depuis les réglages.',
        'Centre de notifications regroupant les alertes de sécurité et les nouveautés.',
        'Dossiers et étiquettes personnalisés pour mieux organiser vos comptes.'
      ],
      improved: [
        'Tableau de bord repensé : recherche, filtres et favoris plus rapides et plus clairs.',
        'Réglages réorganisés avec de nouvelles options de personnalisation.',
        'Possibilité de réinitialiser le coffre depuis les réglages.'
      ],
      removed: [
        "L'ancienne alerte de mots de passe dupliqués, remplacée par le centre de notifications et l'audit de sécurité."
      ],
      fixed: ['Correction du texte d’aide lors de l’import de comptes.']
    },
    en: {
      added: [
        'Guided setup on first launch to configure RootPass step by step, with a recovery hint so you never forget your master password.',
        'Browser extension (Chrome and Firefox) to fill your credentials directly on websites.',
        'Light and dark themes, switchable from settings.',
        'Notification center gathering security alerts and new features.',
        'Custom folders and tags to better organize your accounts.'
      ],
      improved: [
        'Redesigned dashboard: faster, clearer search, filters and favorites.',
        'Reorganized settings with new personalization options.',
        'You can now reset the vault from settings.'
      ],
      removed: [
        'The old duplicate-password alert, replaced by the notification center and the security audit.'
      ],
      fixed: ['Fixed the helper text shown when importing accounts.']
    }
  }
]

function parseVersion(v) {
  return String(v || '0')
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
}

export function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

export function getNotesSince(lastSeen, current) {
  const sorted = [...PATCH_NOTES].sort((a, b) => compareVersions(b.version, a.version))
  const upToCurrent = sorted.filter((n) => compareVersions(n.version, current) <= 0)
  if (!lastSeen) return upToCurrent.slice(0, 1)
  return upToCurrent.filter((n) => compareVersions(n.version, lastSeen) > 0)
}

