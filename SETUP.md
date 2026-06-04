# 🛠️ Setup d'un nouveau PC — RootPass

Procédure pour avoir le projet qui tourne **exactement** comme sur le PC principal,
après un `git clone` tout neuf.

> Pourquoi cette page existe : beaucoup de fichiers sont **gitignorés** (`node_modules`,
> base de données, sorties de build, second remote git...). Un simple `clone` ne suffit
> donc pas, il manque toujours des morceaux. Voici comment les recréer.

---

## 0. Prérequis (à installer une fois par PC)

| Outil       | Version sur le PC principal | Lien                         |
| ----------- | --------------------------- | ---------------------------- |
| **Node.js** | v24.11.1 (npm 11.6.2)       | https://nodejs.org (LTS récent) |
| **Git**     | n'importe quelle version récente | https://git-scm.com      |

> ⚠️ `better-sqlite3` est un module **natif** (C++). Il a besoin des outils de
> compilation. Sur Windows, l'installeur Node.js propose une case
> **« Automatically install the necessary tools / Tools for Native Modules »** :
> coche-la. Sinon installe les *Visual Studio Build Tools* (C++).

---

## 1. Cloner le repo

```powershell
git clone https://github.com/xkddn/RootPass.git
cd RootPass
```

---

## 2. Rajouter le second remote `public`  ⭐ (le piège du clone)

Un clone ne récupère **que** `origin`. Le remote `public` (le repo des releases,
`RootPass-App`) n'existe pas tant que tu ne le rajoutes pas à la main :

```powershell
git remote add public https://github.com/xkddn/RootPass-App.git
git fetch public
```

Vérification (tu dois voir `origin` **et** `public`) :

```powershell
git remote -v
```

> 📄 Pour savoir quoi pousser où, voir **PUSH.md** (workflow des deux dépôts).
> Ce fichier est gitignoré → il n'est présent que sur le PC où il a été créé.

---

## 3. Installer les dépendances

```powershell
npm install
```

Le `postinstall` (`electron-builder install-app-deps`) recompile automatiquement
`better-sqlite3` pour la version d'Electron du projet. 

**Si au lancement tu as une erreur du genre `NODE_MODULE_VERSION mismatch` /
`Error loading better-sqlite3`**, force le rebuild natif :

```powershell
npm run dev:rebuild
```

---

## 4. Lancer en dev

```powershell
npm run dev
```

L'app s'ouvre avec HMR + DevTools. Au **premier lancement**, il n'y a pas de base de
données : c'est normal, RootPass affiche l'écran **« créer le mot de passe maître »**
et crée `vault_V2.db` tout seul dans le dossier `userData`.

---

## 5. À savoir sur les fichiers absents (c'est normal)

Tout ce qui suit est **gitignoré** : ça n'est jamais cloné, et c'est voulu.

| Fichier / dossier        | Pourquoi absent           | Comment le récupérer                       |
| ------------------------ | ------------------------- | ------------------------------------------ |
| `node_modules/`          | dépendances               | `npm install` (étape 3)                    |
| `out/`, `dist/`          | sorties de build          | `npm run build` / `npm run build:win`      |
| `*.db`, `*.sqlite`       | **ton coffre local**      | recréé au 1er lancement (vide)             |
| `.env`                   | (le projet n'en utilise pas) | rien à faire                            |
| `RELEASE.md`, `PUSH.md`  | mémos perso               | présents seulement sur le PC d'origine     |
| `.claude`, `CLAUDE.md`   | config IA                 | non nécessaire pour faire tourner l'app    |
| `coverage/`              | rapport de tests          | `npm run test:coverage`                    |

> 🔐 **Ton coffre (mots de passe) ne se synchronise PAS via Git.** La base est
> chiffrée et locale à chaque machine. Chaque PC a donc son propre coffre. Pour
> transférer tes données d'un PC à l'autre, utilise l'export/import de l'app (pas Git).

---

## 6. Récap express (copier-coller)

```powershell
git clone https://github.com/xkddn/RootPass.git
cd RootPass
git remote add public https://github.com/xkddn/RootPass-App.git
git fetch public
npm install
npm run dev
```

Si erreur native better-sqlite3 → `npm run dev:rebuild`.

---

## Commandes utiles

```powershell
npm run dev        # dev + HMR
npm run build      # type-check + build dans out/
npm run start      # preview d'un build de prod
npm run lint       # ESLint
npm run format     # Prettier
npm run build:win  # installeur Windows (.exe)
npm test           # lance les tests
```
