/**
 * Orchestre le cycle de test de façon cross-OS (Windows / macOS / Linux).
 *
 * better-sqlite3 est un module natif : les tests (Node) et l'app (Electron)
 * ont besoin d'ABI différentes du MÊME fichier .node. On recompile donc pour
 * la bonne cible de chaque côté :
 *   1. rebuild pour Node       -> ABI des tests
 *   2. vitest
 *   3. rebuild pour Electron   -> ABI du `npm run dev` (toujours exécuté)
 *
 * L'étape 3 est dans un `finally` : elle tourne TOUJOURS, même si un test
 * échoue, ce qui garantit que `npm run dev` reste fonctionnel après les tests.
 *
 * Usage :
 *   node scripts/run-tests.js run              (lance les tests une fois)
 *   node scripts/run-tests.js                  (mode watch)
 *   node scripts/run-tests.js run --coverage   (avec couverture)
 */
import { spawnSync } from 'child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true })
  if (result.error) throw result.error
  return result.status ?? 1
}

const vitestArgs = process.argv.slice(2)

// 1. Compile better-sqlite3 pour Node (ABI utilisée par vitest).
run('npm', ['rebuild', 'better-sqlite3'])

let exitCode = 1
try {
  // 2. Lance vitest en transmettant les arguments reçus.
  exitCode = run('npx', ['vitest', ...vitestArgs])
} finally {
  // 3. Recompile pour Electron (restaure l'ABI du dev). electron-rebuild
  //    détecte automatiquement la version d'Electron installée.
  run('npx', ['electron-rebuild', '-f', '-w', 'better-sqlite3'])
}

process.exit(exitCode)
