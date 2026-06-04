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
- **À l'avenir sur public** : seulement les releases (`git push public main --tags` + Release GitHub)
- **Réflexe normal** : push sur `origin` (bouton VSCode)
- **Jamais** d'édition directe sur GitHub

---

## ⚠️ État à finir (au 2026-06-03)

Les 4 commits README ont été rapatriés en local (`git pull public main` ✅).
Il reste à les pousser sur `origin` pour tout aligner :

```powershell
git push origin main
```
