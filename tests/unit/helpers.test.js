/**
 * Tests unitaires - src/main/helpers.js
 *
 * Lock files, detection de conflits et traductions.
 * Utilise un repertoire temporaire reel pour les tests FS.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  writeLockFile,
  removeLockFile,
  checkLockFile,
  detectConflictFiles,
  mt,
  MAIN_STRINGS
} from '../../src/main/helpers.js'

let testDir
let dbPath

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'rootpass-test-'))
  dbPath = join(testDir, 'vault_V2.db')
  writeFileSync(dbPath, '')
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

// ─── writeLockFile ────────────────────────────────────────────────────────

describe('writeLockFile', () => {
  it('cree un fichier vault.lock dans le meme dossier que la DB', () => {
    writeLockFile(dbPath)
    expect(existsSync(join(testDir, 'vault.lock'))).toBe(true)
  })

  it('le fichier contient { host, ts } en JSON valide', () => {
    writeLockFile(dbPath)
    const data = JSON.parse(readFileSync(join(testDir, 'vault.lock'), 'utf-8'))
    expect(typeof data.host).toBe('string')
    expect(typeof data.ts).toBe('number')
    expect(data.ts).toBeGreaterThan(0)
  })

  it('le timestamp est recent (moins de 2 secondes)', () => {
    const before = Date.now()
    writeLockFile(dbPath)
    const data = JSON.parse(readFileSync(join(testDir, 'vault.lock'), 'utf-8'))
    expect(data.ts).toBeGreaterThanOrEqual(before)
    expect(data.ts).toBeLessThanOrEqual(Date.now() + 100)
  })

  it('ne leve pas erreur si le dossier est inaccessible', () => {
    expect(() => writeLockFile('/chemin/inexistant/vault_V2.db')).not.toThrow()
  })
})

// ─── removeLockFile ───────────────────────────────────────────────────────

describe('removeLockFile', () => {
  it('supprime le fichier lock cree par writeLockFile', () => {
    writeLockFile(dbPath)
    expect(existsSync(join(testDir, 'vault.lock'))).toBe(true)
    removeLockFile(dbPath)
    expect(existsSync(join(testDir, 'vault.lock'))).toBe(false)
  })

  it("ne fait rien si le fichier lock n'existe pas", () => {
    expect(() => removeLockFile(dbPath)).not.toThrow()
  })

  it("ne supprime PAS le lock si l'host ne correspond pas", () => {
    writeFileSync(
      join(testDir, 'vault.lock'),
      JSON.stringify({ host: 'autre-machine', ts: Date.now() })
    )
    removeLockFile(dbPath)
    expect(existsSync(join(testDir, 'vault.lock'))).toBe(true)
  })
})

// ─── checkLockFile ────────────────────────────────────────────────────────

describe('checkLockFile', () => {
  it("retourne null si aucun fichier lock n'existe", () => {
    expect(checkLockFile(dbPath)).toBeNull()
  })

  it('retourne null si le lock appartient au meme host', () => {
    writeLockFile(dbPath)
    expect(checkLockFile(dbPath)).toBeNull()
  })

  it("retourne le nom de l'autre host si le lock est recent", () => {
    writeFileSync(
      join(testDir, 'vault.lock'),
      JSON.stringify({ host: 'autre-machine', ts: Date.now() })
    )
    expect(checkLockFile(dbPath)).toBe('autre-machine')
  })

  it('retourne null si le lock est expire (> 2 minutes)', () => {
    const oldTs = Date.now() - 3 * 60 * 1000
    writeFileSync(join(testDir, 'vault.lock'), JSON.stringify({ host: 'autre-machine', ts: oldTs }))
    expect(checkLockFile(dbPath)).toBeNull()
  })

  it('retourne null sur un JSON invalide', () => {
    writeFileSync(join(testDir, 'vault.lock'), 'pas du json')
    expect(checkLockFile(dbPath)).toBeNull()
  })
})

// ─── detectConflictFiles ──────────────────────────────────────────────────

describe('detectConflictFiles', () => {
  it('retourne tableau vide si aucun conflit', () => {
    expect(detectConflictFiles(dbPath)).toEqual([])
  })

  it('detecte les fichiers vault_V2*.db differents du principal', () => {
    writeFileSync(join(testDir, 'vault_V2 (conflicted copy 2024).db'), '')
    writeFileSync(join(testDir, 'vault_V2_backup.db'), '')
    const conflicts = detectConflictFiles(dbPath)
    expect(conflicts.length).toBe(2)
    expect(conflicts).not.toContain('vault_V2.db')
  })

  it("n'inclut pas le fichier principal vault_V2.db", () => {
    expect(detectConflictFiles(dbPath)).not.toContain('vault_V2.db')
  })

  it("retourne tableau vide si le dossier n'existe pas", () => {
    expect(detectConflictFiles('/dossier/inexistant/vault_V2.db')).toEqual([])
  })

  it("n'inclut pas les fichiers non-.db", () => {
    writeFileSync(join(testDir, 'vault_V2.json'), '')
    expect(detectConflictFiles(dbPath)).toEqual([])
  })
})

// ─── mt ──────────────────────────────────────────────────────────────────

describe('mt (traductions)', () => {
  it('retourne la traduction francaise par defaut', () => {
    expect(mt('cancel')).toBe('Annuler')
    expect(mt('trayQuit')).toBe('Quitter')
  })

  it('retourne la traduction anglaise si locale = "en"', () => {
    expect(mt('cancel', 'en')).toBe('Cancel')
    expect(mt('trayQuit', 'en')).toBe('Quit')
  })

  it('retourne francais si locale inconnue', () => {
    expect(mt('cancel', 'de')).toBe('Annuler')
    expect(mt('cancel', undefined)).toBe('Annuler')
  })

  it('toutes les cles fr existent aussi en en', () => {
    const frKeys = Object.keys(MAIN_STRINGS.fr)
    const enKeys = Object.keys(MAIN_STRINGS.en)
    for (const key of frKeys) {
      expect(enKeys).toContain(key)
    }
  })

  it("aucune valeur n'est undefined dans les deux locales", () => {
    for (const strings of Object.values(MAIN_STRINGS)) {
      for (const value of Object.values(strings)) {
        expect(value).toBeDefined()
        expect(typeof value).toBe('string')
      }
    }
  })
})
