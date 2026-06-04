# 📤 Workflow Git — RootPass

Mémo pour s'y retrouver entre les deux dépôts.

## Les deux dépôts

| Remote   | Dépôt GitHub         | Rôle                                                            |
| -------- | -------------------- | -------------------------------------------------------------- |
| `origin` | `xkddn/RootPass`     | **Source de vérité** — tout le dev, les features, le quotidien  |
| `public` | `xkddn/RootPass-App` | **Releases uniquement** — ce que les gens voient/téléchargent   |

## 🥇 Règle d'or

**On ne modifie JAMAIS rien directement sur GitHub.**
Tout part du local → `origin`. Le `public` ne reçoit que des snapshots au moment des releases.

## 📂 Fichiers perso (synchronisés sur `origin` uniquement)

Mes fichiers perso — `.claude`, `.agents`, `skills-lock.json`, et les mémos `PUSH.md`,
`RELEASE.md`, `SETUP.md`, `CLAUDE.md` — sont **suivis sur `origin`** pour les retrouver
sur tous mes PC après un `git pull`. Ils sont **retirés automatiquement du repo public**
par `release-public.ps1`. (Seuls `.claude/settings.local.json` et les credentials restent
hors de Git car spécifiques à la machine — cf. `.gitignore`.)

---

## Au quotidien (dev, features, fix README, etc.)

```powershell
git add .
git commit -m "ma feature"
git push origin main
```

👉 C'est exactement ce que fait le bouton **Sync / Push** de VSCode (il va sur `origin`). Rien à changer.

---

## Au moment d'une release (ex: v1.0.3)

```powershell
git push origin main           # repo perso : code (avec tes fichiers perso)
.\release-public.ps1 v1.0.3    # repo public : snapshot SANS fichiers perso + tag
```

> ⚠️ On n'utilise **plus** `git push public main --tags` directement : ça enverrait
> tes fichiers perso (`.claude`, `.agents`, mémos `.md`…) sur le repo public.
> Le script `release-public.ps1` pousse une version nettoyée à la place.

Puis sur GitHub, repo **RootPass-App** :
**Releases** → *Draft a new release* → choisir le tag `v1.0.3` → attacher l'installeur `.exe` (issu de `npm run build:win`).

---

## Si un jour tu as édité un truc directement sur le public

(comme les README édités sur GitHub) → on rapatrie :

```powershell
git pull public main
git push origin main
```

---

## Rappel express

- **Récupérer ce qui est sur public → ici** : `git pull public main`
- **À l'avenir sur public** : seulement les releases (`.\release-public.ps1 vX.X.X` + Release GitHub)
- **Réflexe normal** : push sur `origin` (bouton VSCode)
- **Jamais** d'édition directe sur GitHub

---

## ⚠️ À faire une fois (mise en place du suivi des fichiers perso)

Depuis le 2026-06-04, mes fichiers perso sont suivis sur `origin` (voir section
« Fichiers perso » plus haut). Pour activer ça la première fois :

```powershell
git add .
git commit -m "Sync fichiers perso sur origin + script release public"
git push origin main
```

Ensuite, sur chaque autre PC, un simple `git pull origin main` ramène tout d'un coup.
