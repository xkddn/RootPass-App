const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf-8' }).trim()
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'))
const nextVersion = pkg.version

let lastTag = ''
try {
  lastTag = git('describe --tags --abbrev=0')
} catch {
  lastTag = ''
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
const commits = git(`log ${range} --pretty=format:"- %s"`)
const stat = git(`diff ${range} --stat`)

const out = `# Materiel patchnotes pour v${nextVersion}

Derniere release: ${lastTag || '(aucune)'}

## Commits
${commits || '(aucun)'}

## Fichiers changes
${stat || '(aucun)'}

---
Donne ce bloc a Claude avec la consigne:
"Redige une entree patchnotes user-friendly (FR + EN) pour la version ${nextVersion},
classee en added/improved/removed/fixed, dans le format de src/renderer/src/data/patchnotes.js.
Vise les utilisateurs finaux, pas les devs. Pas de jargon technique, pas de em-dash."
`

const dest = path.join(__dirname, '..', 'PATCHNOTES_DRAFT.md')
fs.writeFileSync(dest, out, 'utf-8')
console.log(out)
console.log(`\nEcrit dans ${dest}`)
