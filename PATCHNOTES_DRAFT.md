# Materiel patchnotes pour v1.4.2

Derniere release: v1.3.1

## Commits
- FIX bugs AddAccountModal
- v1.4.1
- PUSH Update .mds
- PUSH Onglet CSV import, clic-hors-modal pour fermer, anim modals, contraste thème clair + grille
- PUSH Notes sécurisées, onglets Notes + URL manquante, tri du dashboard, menu burger responsive, complétion auto des URL (dictionnaire local)
- PUSH Update Patchnotes
- 1.4.0
- PUSH Update package
- Chiffrement titre/categorie/tags/dossiers, fix changement mdp maitre, preview compte, refonte sync settings
- PUSH Extension Link in Tuto
- PUSH 13/06 V4

## Fichiers changes
PATCHNOTES_DRAFT.md                                |  51 +-
 PUSH.md                                            |  40 +-
 extension/content.js                               |  28 +-
 extension/manifest.firefox.json                    |   5 +-
 package-lock.json                                  | 216 +++---
 package.json                                       |   2 +-
 resources/img/icon-128.png                         | Bin 0 -> 9792 bytes
 src/main/accounts.js                               | 191 ++++--
 src/main/auth.js                                   |  77 +++
 src/main/database.js                               |   6 +
 src/main/folders.js                                |  40 +-
 src/main/index.js                                  |  31 +-
 src/main/urlderive.js                              | 332 +++++++++-
 src/preload/index.js                               |   4 +
 src/renderer/src/App.jsx                           |  16 +-
 src/renderer/src/assets/main.css                   |  90 ++-
 src/renderer/src/components/AddAccountModal.jsx    | 382 +++++++----
 src/renderer/src/components/AutofillSelector.jsx   |   5 +-
 src/renderer/src/components/ConfirmDialog.jsx      |   4 +-
 src/renderer/src/components/CustomSelect.jsx       |   7 +-
 src/renderer/src/components/Dashboard.jsx          | 647 +++++++++++++++---
 src/renderer/src/components/EditAccountModal.jsx   | 322 +++++----
 src/renderer/src/components/ImportModal.jsx        | 269 +++++++-
 src/renderer/src/components/NotificationCenter.jsx |  42 +-
 src/renderer/src/components/Onboarding.jsx         | 154 ++++-
 src/renderer/src/components/PatchNotesModal.jsx    |  33 +-
 src/renderer/src/components/Settings.jsx           | 728 +++++++++++++++++----
 src/renderer/src/components/SpotlightWindow.jsx    |   1 +
 src/renderer/src/data/patchnotes.js                |  72 ++
 src/renderer/src/i18n/en.json                      |  82 ++-
 src/renderer/src/i18n/fr.json                      |  82 ++-
 src/renderer/src/utils/auditHelpers.js             |   9 +-
 store-assets/rootpass-chrome-1.3.1.zip             | Bin 0 -> 59370 bytes
 store-assets/rootpass-firefox-1.3.1.zip            | Bin 0 -> 59513 bytes
 34 files changed, 3120 insertions(+), 848 deletions(-)

---
Donne ce bloc a Claude avec la consigne:
"Redige une entree patchnotes user-friendly (FR + EN) pour la version 1.4.2,
classee en added/improved/removed/fixed, dans le format de src/renderer/src/data/patchnotes.js.
Vise les utilisateurs finaux, pas les devs. Pas de jargon technique, pas de em-dash."
