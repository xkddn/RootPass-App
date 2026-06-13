export const PATCH_NOTES = [
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

