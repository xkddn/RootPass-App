# 📤 Workflow Git & Releases — RootPass

## Les deux dépôts

| Remote   | Dépôt GitHub         | Rôle                                    |
| -------- | -------------------- | --------------------------------------- |
| `origin` | `xkddn/RootPass`     | **privé** — Quotidient                  |
| `public` | `xkddn/RootPass-App` | **public** — Open source + **Releases** |

## 🥇

**On ne modifie JAMAIS rien directement sur GitHub.**
Tout part du local → `origin`. Le `public` ne reçoit que des snapshots au moment des releases.

## 📂 Fichiers perso (suivis sur `origin` uniquement)

Mes fichiers perso — `.claude`, `.agents`, `skills-lock.json`, et les mémos `PUSH.md`,
`SETUP.md`, `CLAUDE.md` — sont **suivis sur `origin`** pour les retrouver sur tous mes PC
après un `git pull`. Ils sont **retirés automatiquement du repo public** par
`release-public.ps1`. (Seuls `.claude/settings.local.json` et les credentials restent hors
de Git — cf. `.gitignore`.)

---

## 1. Au quotidien (dev, features, fix README…)

```powershell
git add .
git commit -m "ma feature"
git push origin main
```

---

## 2. Sortir une release (ex. v1.0.3)

```powershell
npm version patch              # 1.0.2 -> 1.0.3
npm version minor              # 1.0.2 → 1.1.0
npm version major              # → 2.0.0

git push origin main --tags    # privé : code + tag + fichiers perso
.\release-public.ps1 v1.0.3    # PUBLIC : snapshot nettoyé + tag = déclenche le robot
```

---

### Aide-mémoire ultra-court

```powershell
npm version patch
git push origin main --tags
.\release-public.ps1 v1.0.3
```

---

## Si tu as édité un truc directement sur le public

(README édité sur GitHub, etc.) → on rapatrie :

```powershell
git pull public main
git push origin main
```

---

## Si ça coince

| Souci                            | Solution                                                          |
| -------------------------------- | ----------------------------------------------------------------- |
| Le robot ne démarre pas          | Tag pas poussé sur public → relance `.\release-public.ps1 vX.X.X` |
| Erreur 403 dans Actions          | GitHub → Settings → Actions → **Read and write permissions**      |
| Le job `publish` ne part pas     | Normal : il attend que les 3 builds soient finis                  |
| Users reçoivent rien             | Release restée en _draft_, ou version pas bumpée                  |
| Polices/icônes absentes du build | Importer les CSS tiers en JS dans `main.jsx`, pas en `@import`    |
| Build local sans le robot        | `npm run build:win` (juste l'installeur, ton OS uniquement)       |

---

## Liens utiles

- Actions : https://github.com/xkddn/RootPass-App/actions
- Releases : https://github.com/xkddn/RootPass-App/releases
- Lien de téléchargement (toujours à jour) : https://github.com/xkddn/RootPass-App/releases/latest

