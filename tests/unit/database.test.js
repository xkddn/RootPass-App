/**
 * Tests unitaires - database.js
 *
 * Teste la gestion de la connexion SQLite, la creation du schema
 * et les migrations ad-hoc (pattern ALTER TABLE + try/catch).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

let openDatabase, getDb, getCurrentDbPath, closeDatabase

beforeEach(async () => {
  vi.resetModules()
  const db = await import('../../src/main/database.js')
  openDatabase = db.openDatabase
  getDb = db.getDb
  getCurrentDbPath = db.getCurrentDbPath
  closeDatabase = db.closeDatabase
})

afterEach(() => {
  closeDatabase()
})

// ─── openDatabase ─────────────────────────────────────────────────────────

describe('openDatabase', () => {
  it('ouvre une DB en memoire sans erreur', () => {
    expect(() => openDatabase(':memory:')).not.toThrow()
  })

  it('retourne un objet Database utilisable', () => {
    const db = openDatabase(':memory:')
    expect(db).toBeDefined()
    expect(typeof db.prepare).toBe('function')
  })

  it('ferme et reouvre proprement si appelee deux fois', () => {
    openDatabase(':memory:')
    expect(() => openDatabase(':memory:')).not.toThrow()
    expect(() => getDb().prepare('SELECT 1').get()).not.toThrow()
  })
})

// ─── Schema : table master_check ──────────────────────────────────────────

describe('Schema - master_check', () => {
  beforeEach(() => openDatabase(':memory:'))

  it('cree la table master_check', () => {
    const row = getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='master_check'")
      .get()
    expect(row).toBeDefined()
    expect(row.name).toBe('master_check')
  })

  it('master_check possede les colonnes salt, canary, iterations', () => {
    const cols = getDb().prepare('PRAGMA table_info(master_check)').all()
    const names = cols.map((c) => c.name)
    expect(names).toContain('salt')
    expect(names).toContain('canary')
    expect(names).toContain('iterations')
  })

  it('master_check accepte id = 1 uniquement (contrainte CHECK)', () => {
    getDb().prepare("INSERT INTO master_check (id, salt, canary) VALUES (1, 'sel', 'canary')").run()
    expect(() =>
      getDb().prepare("INSERT INTO master_check (id, salt, canary) VALUES (2, 'x', 'y')").run()
    ).toThrow()
  })
})

// ─── Schema : table accounts ──────────────────────────────────────────────

describe('Schema - accounts', () => {
  beforeEach(() => openDatabase(':memory:'))

  it('cree la table accounts', () => {
    const row = getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'")
      .get()
    expect(row).toBeDefined()
  })

  it('accounts possede toutes les colonnes attendues', () => {
    const cols = getDb().prepare('PRAGMA table_info(accounts)').all()
    const names = cols.map((c) => c.name)
    const expected = [
      'id',
      'title',
      'url',
      'login',
      'password',
      'category',
      'is_favorite',
      'custom_fields',
      'created_at',
      'password_updated_at',
      'totp_secret'
    ]
    for (const col of expected) {
      expect(names).toContain(col)
    }
  })

  it('is_favorite vaut 0 par defaut', () => {
    const cols = getDb().prepare('PRAGMA table_info(accounts)').all()
    const col = cols.find((c) => c.name === 'is_favorite')
    expect(col.dflt_value).toBe('0')
  })
})

// ─── Migration idempotente ────────────────────────────────────────────────

describe('Migration idempotente', () => {
  it('openDatabase peut etre appele plusieurs fois sans erreur de migration', () => {
    // La premiere ouverture cree le schema + tente ALTER TABLE
    openDatabase(':memory:')
    closeDatabase()
    // Pas possible de rouvrir la meme :memory:, mais on verifie que le mecanisme
    // try/catch des migrations ne leve pas d'erreur sur une DB deja a jour
    expect(() => openDatabase(':memory:')).not.toThrow()
  })
})

// ─── getDb ────────────────────────────────────────────────────────────────

describe('getDb', () => {
  it('retourne la DB ouverte sans rappeler openDatabase', () => {
    openDatabase(':memory:')
    const db1 = getDb()
    const db2 = getDb()
    expect(db1).toBe(db2)
  })
})

// ─── getCurrentDbPath ─────────────────────────────────────────────────────

describe('getCurrentDbPath', () => {
  it('retourne getDefaultDbPath() par defaut (jamais null : fallback via ??)', () => {
    // getCurrentDbPath() = currentDbPath ?? getDefaultDbPath()
    // currentDbPath est null avant openDatabase, donc renvoie le chemin par defaut
    const p = getCurrentDbPath()
    expect(typeof p).toBe('string')
    expect(p.length).toBeGreaterThan(0)
  })

  it('retourne le chemin passe a openDatabase', () => {
    openDatabase(':memory:')
    expect(getCurrentDbPath()).toBe(':memory:')
  })
})

// ─── closeDatabase ────────────────────────────────────────────────────────

describe('closeDatabase', () => {
  it('ferme la connexion sans erreur', () => {
    openDatabase(':memory:')
    expect(() => closeDatabase()).not.toThrow()
  })

  it('peut etre appelee plusieurs fois sans erreur', () => {
    openDatabase(':memory:')
    closeDatabase()
    expect(() => closeDatabase()).not.toThrow()
  })

  it('remet getCurrentDbPath au chemin par defaut apres fermeture (currentDbPath = null -> fallback)', () => {
    openDatabase(':memory:')
    expect(getCurrentDbPath()).toBe(':memory:')
    closeDatabase()
    // currentDbPath = null -> getCurrentDbPath() renvoie getDefaultDbPath()
    expect(getCurrentDbPath()).not.toBe(':memory:')
  })
})
