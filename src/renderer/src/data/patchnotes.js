export const PATCH_NOTES = [
  {
    version: '1.4.3',
    date: '2026-10-05',
    fr: {
      added: [
        'Bouton « Tout supprimer » dans les réglages (section Autre) pour vider votre coffre en une fois, avec une confirmation avant d’effacer quoi que ce soit.'
      ],
      improved: [],
      removed: [],
      fixed: [
        'Le menu des notifications s’affiche désormais en entier, même dans une petite fenêtre.',
        'Le bouton « Nouveau code » ne dépasse plus de son cadre lors de la connexion de l’extension navigateur.',
        'Correction de plusieurs bugs dans les fenêtres d’ajout et de modification d’un compte.'
      ]
    },
    en: {
      added: [
        'A “Delete everything” button in settings (Other section) to empty your vault in one go, with a confirmation before anything is erased.'
      ],
      improved: [],
      removed: [],
      fixed: [
        'The notifications menu now shows in full, even in a small window.',
        'The “New code” button no longer overflows its frame when connecting the browser extension.',
        'Fixed several bugs in the add and edit account windows.'
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

