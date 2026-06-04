# 🛠️ Setup sur un nouveau PC

## Prérequis (une fois par PC)

- **Node.js** v24+ (npm 11+) — https://nodejs.org
- **Git** récent — https://git-scm.com

⚠️ `better-sqlite3` est un module natif (C++). Sur Windows, coche **« Tools for Native Modules »** dans l'installeur Node.js (ou installe les _Visual Studio Build Tools_ C++).

## Étapes

```powershell
git clone https://github.com/xkddn/RootPass.git
cd RootPass
git remote add public https://github.com/xkddn/RootPass-App.git   # remote des releases, non cloné
git fetch public                                                  # telecharge l'histo du public
npm install                                                       # postinstall recompile better-sqlite3
npm run dev
```

- **Vérifier les remotes** : `git remote -v` doit lister `origin` **et** `public`.
- **Erreur `NODE_MODULE_VERSION` / `Error loading better-sqlite3`** → `npm run dev:rebuild`.

## Fichiers absents (normal, gitignorés)

| Fichier / dossier             | Comment le récupérer                  |
| ----------------------------- | ------------------------------------- |
| `node_modules/`               | `npm install`                         |
| `out/`, `dist/`               | `npm run build` / `npm run build:win` |
| `*.db`, `*.sqlite`            | recréé au 1er lancement (vide)        |
| `.claude/settings.local.json` | recréé par Claude Code si besoin      |

## Commandes utiles

```powershell
npm run dev        # dev + HMR
npm run build      # type-check + build dans out/
npm run start      # preview d'un build de prod
npm run lint       # ESLint
npm run format     # Prettier
npm run build:win  # installeur Windows (.exe)
```
