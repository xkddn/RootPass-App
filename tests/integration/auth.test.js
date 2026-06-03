/**
 * Tests integration - auth.js
 *
 * Chaque describe bloc obtient ses propres instances de modules via vi.resetModules()
 * + import dynamique, et une DB SQLite en memoire fraiche.
 * Cela isole les variables de module (activeKey, failedAttempts) entre les groupes.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

async function loadModules() {
  vi.resetModules()
  const db = await import('../../src/main/database.js')
  const auth = await import('../../src/main/auth.js')
  return { db, auth }
}

// ─── Coffre vierge ────────────────────────────────────────────────────────

describe('Coffre vierge (non initialise)', () => {
  let db, auth

  beforeEach(async () => {
    ;({ db, auth } = await loadModules())
    db.openDatabase(':memory:')
  })

  afterEach(() => auth.lockVault())

  it('isVaultInitialized retourne false', () => {
    expect(auth.isVaultInitialized()).toBe(false)
  })

  it("getActiveKey leve 'Vault is locked'", () => {
    expect(() => auth.getActiveKey()).toThrow('Vault is locked')
  })

  it('verifyMasterPassword rejette si le coffre est vide', async () => {
    await expect(auth.verifyMasterPassword('quelconque')).rejects.toThrow()
  })
})

// ─── setupMasterPassword ──────────────────────────────────────────────────

describe('setupMasterPassword', () => {
  let db, auth

  beforeEach(async () => {
    ;({ db, auth } = await loadModules())
    db.openDatabase(':memory:')
  })

  afterEach(() => auth.lockVault())

  it('retourne true et initialise le coffre', () => {
    expect(auth.setupMasterPassword('monPassword123!')).toBe(true)
    expect(auth.isVaultInitialized()).toBe(true)
  })

  it('stocke les iterations PBKDF2 = 600 000 en base', () => {
    auth.setupMasterPassword('pass')
    const row = db.getDb().prepare('SELECT iterations FROM master_check WHERE id = 1').get()
    expect(row.iterations).toBe(600000)
  })

  it('leve une erreur si appele deux fois (contrainte UNIQUE)', () => {
    auth.setupMasterPassword('pass1')
    expect(() => auth.setupMasterPassword('pass2')).toThrow()
  })

  it('stocke un sel hex de 32 caracteres', () => {
    auth.setupMasterPassword('pass')
    const row = db.getDb().prepare('SELECT salt FROM master_check WHERE id = 1').get()
    expect(row.salt).toMatch(/^[0-9a-f]{32}$/)
  })

  it('stocke un canary au format iv:authTag:ciphertext', () => {
    auth.setupMasterPassword('pass')
    const row = db.getDb().prepare('SELECT canary FROM master_check WHERE id = 1').get()
    expect(row.canary.split(':').length).toBe(3)
  })
})

// ─── verifyMasterPassword ─────────────────────────────────────────────────

describe('verifyMasterPassword', () => {
  let db, auth

  beforeEach(async () => {
    ;({ db, auth } = await loadModules())
    db.openDatabase(':memory:')
    auth.setupMasterPassword('bon-mot-de-passe')
  })

  afterEach(() => auth.lockVault())

  it('retourne true avec le bon mot de passe', async () => {
    const result = await auth.verifyMasterPassword('bon-mot-de-passe')
    expect(result).toBe(true)
  })

  it('active la cle apres succes (getActiveKey ne leve plus)', async () => {
    await auth.verifyMasterPassword('bon-mot-de-passe')
    const key = auth.getActiveKey()
    expect(key).toBeInstanceOf(Buffer)
    expect(key.length).toBe(32)
  })

  it('retourne null avec le mauvais mot de passe', async () => {
    const result = await auth.verifyMasterPassword('mauvais-mot-de-passe')
    expect(result).toBeNull()
  })

  it('ne leve pas erreur avec un mauvais mot de passe (null silencieux)', async () => {
    await expect(auth.verifyMasterPassword('wrong')).resolves.toBeNull()
  })

  it('reset failedAttempts apres un succes', async () => {
    await auth.verifyMasterPassword('wrong')
    await auth.verifyMasterPassword('wrong')
    const result = await auth.verifyMasterPassword('bon-mot-de-passe')
    expect(result).toBe(true)
  })
})

// ─── lockVault / getActiveKey ─────────────────────────────────────────────

describe('lockVault / getActiveKey', () => {
  let db, auth

  beforeEach(async () => {
    ;({ db, auth } = await loadModules())
    db.openDatabase(':memory:')
    auth.setupMasterPassword('pass')
    await auth.verifyMasterPassword('pass')
  })

  it('getActiveKey retourne une cle de 32 octets apres unlock', () => {
    const key = auth.getActiveKey()
    expect(key).toBeInstanceOf(Buffer)
    expect(key.length).toBe(32)
  })

  it('lockVault supprime la cle active', () => {
    auth.lockVault()
    expect(() => auth.getActiveKey()).toThrow('Vault is locked')
  })

  it('peut se deverrouiller a nouveau apres un lock', async () => {
    auth.lockVault()
    await auth.verifyMasterPassword('pass')
    expect(() => auth.getActiveKey()).not.toThrow()
  })

  it('lock -> unlock -> lock fonctionne plusieurs fois de suite', async () => {
    for (let i = 0; i < 3; i++) {
      auth.lockVault()
      await auth.verifyMasterPassword('pass')
      expect(auth.getActiveKey()).toBeInstanceOf(Buffer)
    }
  })
})

// ─── Protection anti-brute-force ──────────────────────────────────────────

describe('Throttling anti-brute-force', () => {
  let db, auth

  beforeEach(async () => {
    ;({ db, auth } = await loadModules())
    db.openDatabase(':memory:')
    auth.setupMasterPassword('pass')
  })

  afterEach(() => auth.lockVault())

  it('ajoute un delai >= 900ms apres 5 echecs consecutifs', async () => {
    for (let i = 0; i < 5; i++) {
      await auth.verifyMasterPassword('wrong')
    }
    const start = Date.now()
    await auth.verifyMasterPassword('wrong')
    expect(Date.now() - start).toBeGreaterThanOrEqual(900)
  }, 15000)
})
