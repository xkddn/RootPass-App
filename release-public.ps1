param(
    [Parameter(Mandatory = $true)]
    [string]$Tag
)

$ErrorActionPreference = "Stop"

# Fichiers / dossiers perso à NE PAS publier sur le repo public.
$private = @(
    ".agents",
    ".claude",
    "CLAUDE.md",
    "skills-lock.json",
    "RELEASE.md",
    "PUSH.md",
    "SETUP.md",
    "release-public.ps1"
)

Write-Host "==> Préparation du snapshot public pour $Tag ..." -ForegroundColor Cyan

# 1. On part d'un main propre et à jour.
git checkout main
git pull origin main

# 2. Branche temporaire = copie exacte de main.
git branch -f public-snapshot main
git checkout public-snapshot

# 3. On retire les fichiers perso de CE commit uniquement.
#    (--cached = on les sort de Git, mais ils restent sur le disque)
git rm -r --cached --ignore-unmatch $private | Out-Null
git commit -m "$Tag"

# 4. Tag + push du snapshot propre vers public/main.
git tag -f $Tag
git push public public-snapshot:main --force
git push public $Tag --force

# 5. Retour sur main (qui a gardé TOUS tes fichiers) + nettoyage.
git checkout main
git branch -D public-snapshot

Write-Host ""
Write-Host "OK -> Snapshot $Tag poussé sur public (sans tes fichiers perso)." -ForegroundColor Green
Write-Host "      Va maintenant sur GitHub (RootPass-App) > Releases > Draft a new release"
Write-Host "      sur le tag $Tag, et attache l'installeur .exe (npm run build:win)."
