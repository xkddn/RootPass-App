<div align="center">
  <h1>RootPass</h1>
  <p>Un gestionnaire de mots de passe local et hors ligne pour Windows, macOS et Linux.</p>
</div>

<!-- README-I18N:START -->

**Français** | [English](./README.en.md)

<!-- README-I18N:END -->

---

RootPass stocke vos mots de passe dans une base SQLite chiffrée AES-256-GCM sur votre machine. Aucun compte, aucun serveur, aucune télémétrie. Le mot de passe maître n'est jamais écrit nulle part, il dérive uniquement la clé de chiffrement à chaque déverrouillage.

## Fonctionnalités

- **Coffre chiffré**: AES-256-GCM avec une clé dérivée par PBKDF2
- **TOTP / 2FA**: Génère des codes à 6 chiffres en direct depuis les secrets stockés, sans application externe
- **Audit de sécurité**: Signale les mots de passe faibles, dupliqués et anciens (> 90 jours)
- **Générateur de mots de passe**: Longueur et caractères configurables, avec indicateur de force
- **Launcher Spotlight**: Raccourci global pour rechercher dans le coffre depuis n'importe où sur le bureau
- **Synchronisation**: Pointez le coffre vers un dossier cloud (OneDrive, Dropbox…), une clé USB, ou exportez un snapshot chiffré `.enc`
- **Champs personnalisés**: Ajoutez des clé/valeur à chaque compte, chiffrées au repos
- **Catégories et favoris**: Organisez vos comptes, filtrez en un clic
- **Import/export JSON**: Migration facile depuis un autre gestionnaire
- **Français et anglais**: Changez de langue dans les paramètres

## Technologies

| Couche          | Tech                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| Shell           | [Electron](https://electronjs.org)                                         |
| UI              | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| Build           | [electron-vite](https://electron-vite.org)                                 |
| Base de données | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)               |
| Crypto          | Natif Node.js (AES-256-GCM, PBKDF2)                                        |
| 2FA             | [otplib](https://github.com/yeojz/otplib)                                  |
| État            | [Zustand](https://zustand-demo.pmnd.rs)                                    |
| i18n            | [i18next](https://www.i18next.com)                                         |

## Tests

```bash
npm test              # 193 tests unitaires + intégration
npm run test:coverage # Couverture (~98% statements, 100% fonctions)
npm run test:e2e      # Tests bout en bout (requiert npm run build d'abord)
```

Couverture : `src/main/` et `src/renderer/src/utils/` — crypto, base de données, comptes, authentification, génération de mots de passe, audit de sécurité.

## Modèle de sécurité

- Le mot de passe maître n'est jamais stocké. Lors de l'initialisation, un sel aléatoire et une chaîne "canary" chiffrée avec la clé dérivée sont écrits. Au déverrouillage, la clé est re-dérivée et acceptée uniquement si le canary se déchiffre correctement.
- Chaque mot de passe et secret TOTP est stocké sous la forme `iv:authTag:ciphertext` (hex). La clé ne quitte jamais le processus principal, seul le texte déchiffré traverse l'IPC vers le renderer.
- Le fichier du coffre est une base SQLite standard à `<userData>/vault_V2.db`. Vous pouvez le déplacer vers un dossier synchronisé ou une clé USB via Paramètres → Sync ; le fichier reste chiffré AES-256 au repos.

> [!WARNING]
> Si vous oubliez votre mot de passe maître, le coffre est irrécupérable. Aucun mécanisme de réinitialisation n'existe par conception. Faites des sauvegardes et choisissez un mot de passe mémorable.

## Open Source & Téléchargement

RootPass est un projet 100 % open source, gratuit et accessible à tous. Vous pouvez auditer le code en toute transparence pour valider le modèle de sécurité, compiler l'application vous-même, ou télécharger directement les versions prêtes à l'emploi (Windows, macOS, Linux) depuis le **[site web](https://root-pass-website.vercel.app/)**.

## Contribuer

Les signalements de bugs et demandes de fonctionnalités passent par [GitHub Issues](https://github.com/xkddn/RootPass-App/issues).

## Téléchargements

![Téléchargements](https://img.shields.io/github/downloads/xkddn/RootPass-App/total?style=flat-square&color=10B981&label=Téléchargements)

## Licence

[MIT](LICENSE) - © 2026 xkddn
