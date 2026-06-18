/**
 * Sauvegarde le binaire Electron de better-sqlite3 avant les tests,
 * et le restaure après. Evite le cycle rebuild qui casse npm run dev.
 *
 * Usage :
 *   node scripts/swap-sqlite.js save    (avant les tests)
 *   node scripts/swap-sqlite.js restore (après les tests)
 */
import { copyFileSync, existsSync } from 'fs'

const NODE_BIN = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
const ELECTRON_BIN = 'node_modules/better-sqlite3/better_sqlite3.electron.node'

const mode = process.argv[2]

if (mode === 'save') {
  if (existsSync(NODE_BIN)) {
    copyFileSync(NODE_BIN, ELECTRON_BIN)
    console.log('better-sqlite3: binaire Electron sauvegardé')
  }
} else if (mode === 'restore') {
  if (existsSync(ELECTRON_BIN)) {
    copyFileSync(ELECTRON_BIN, NODE_BIN)
    console.log('better-sqlite3: binaire Electron restauré')
  } else {
    console.warn('better-sqlite3: pas de sauvegarde trouvée, lance npm run dev:rebuild')
  }
}
