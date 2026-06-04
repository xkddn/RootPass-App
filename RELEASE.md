# Sortir une release

## Le principe en 2 lignes

Tu pousses un **tag de version** (ex. `v1.0.2`) sur le repo **public** → un robot GitHub Actions build les installeurs Win/Mac/Linux et crée **une seule Release**. L'app installée chez les users compare les numéros de version et se met à jour toute seule.

> `git push` envoie juste le code. Ce sont les **Releases** (avec les `.exe`/`.dmg` + les `latest*.yml`) qui livrent les mises à jour.

## Les 2 repos

| Remote   | Dépôt                | Rôle                                         |
| -------- | -------------------- | -------------------------------------------- |
| `origin` | `xkddn/RootPass`     | **privé** — ton historique de dev            |
| `public` | `xkddn/RootPass-App` | **public** — code open source + **Releases** |

---

## La procédure complète (copier-coller)

### 1. Coder et sauvegarder (au fil du dev)

Tu bosses, et tu sauvegardes sur ton repo **privé** quand tu veux :

```powershell
git add -A
git commit -m "ce que tu as fait"
git push origin main
```

→ Rien de public, rien de livré. C'est ton brouillon.

### 2. Sortir une version (quand c'est prêt)

```powershell
npm version patch                 # bump 1.0.1 -> 1.0.2 (modifie package.json, commit + tag auto)

git push origin main --tags       # sauvegarde sur le privé (code + tag)
git push public main --tags       # PUSH DU TAG SUR PUBLIC = déclenche le robot
```

> `--tags` est le point clé : c'est le push du tag `vX.X.X` sur **public** qui lance le build.

### 3. Surveiller et publier

1. GitHub → `RootPass-App` → onglet **Actions** : le workflow tourne.
   - D'abord 3 jobs `build` (windows / macos / ubuntu) en parallèle.
   - Puis **1 job `publish`** qui démarre quand les 3 builds sont verts.
2. Quand tout est ✅ → onglet **Releases** : **un seul draft** `vX.X.X` complet.
3. Relis, puis clique **Publish release**.

> ⚠️ Tant que la Release est en *draft*, personne ne reçoit la MAJ. Il faut cliquer **Publish**.

### Aide-mémoire ultra-court

```powershell
npm version patch
git push origin main --tags
git push public main --tags
# → Actions (attendre ✅) → Releases → Publish release
```

---

## Pourquoi le workflow est en 2 étapes (build puis publish)

Au début, les 3 OS publiaient chacun leur Release en même temps → ça créait **2-3 drafts éclatés** (les fichiers répartis n'importe comment). Le workflow corrigé sépare le travail :

1. **`build`** : chaque OS fabrique ses installeurs et les dépose en « artifacts » temporaires (sans publier).
2. **`publish`** : un seul job récupère tout et crée **UNE** Release propre.

→ Plus jamais de double-draft ni de fusion manuelle.

---

## Quelle version bumper ?

Format `MAJEUR.MINEUR.CORRECTIF` (ex. `1.4.2`) :

| Commande            | Quand                                     |
| ------------------- | ----------------------------------------- |
| `npm version patch` | correction de bug (1.0.1 → 1.0.2)         |
| `npm version minor` | nouvelle fonctionnalité (1.0.1 → 1.1.0)   |
| `npm version major` | changement qui casse l'existant (→ 2.0.0) |

`npm version` fait 3 choses d'un coup : modifie `package.json`, crée le **commit**, crée le **tag**.

---

## Tester la MAJ auto (validé en 1.0.1 ✅)

1. Garde une **ancienne** version installée (ex. 1.0.1).
2. Publie la nouvelle (ex. 1.0.2), Release **publiée** (pas draft).
3. **Ferme complètement** l'app installée, puis **relance-la**.
4. Elle détecte la nouvelle version → popup de téléchargement → au redémarrage, elle s'installe seule.

> ⚠️ La MAJ auto ne marche **que sur l'app installée**, pas en `npm run dev`.

---

## Config initiale (déjà faite, pour mémoire)

1. `git push public main` (pour que le robot existe sur le repo public).
2. GitHub → `RootPass-App` → Settings → Actions → General → **Read and write permissions** → Save.

---

## Si ça coince

| Souci                            | Solution                                                          |
| -------------------------------- | ----------------------------------------------------------------- |
| Le robot ne démarre pas          | Tag pas poussé sur public → `git push public main --tags`         |
| Erreur 403 dans Actions          | Active *Read and write permissions* (config initiale)             |
| Le job `publish` ne part pas     | Normal : il attend que les 3 builds soient finis                  |
| Users reçoivent rien             | Release restée en *draft*, ou version pas bumpée                  |
| Polices/icônes absentes du build | Importer les CSS tiers en JS dans `main.jsx`, pas en `@import`    |
| Build local sans le robot        | `npm run build:win` (juste l'installeur, ton OS uniquement)       |

---

## Liens utiles

- Actions (suivi des builds) : https://github.com/xkddn/RootPass-App/actions
- Releases : https://github.com/xkddn/RootPass-App/releases
- Lien de téléchargement pour ton site (toujours à jour) : https://github.com/xkddn/RootPass-App/releases/latest
