/**
 * Tests integration - accounts.js
 *
 * Chaque test opere sur une DB SQLite :memory: fraiche + une session deverrouillee.
 * Tous les champs sensibles (password, url, login, totp_secret, custom_fields)
 * sont stockes chiffres - on verifie les valeurs dechiffrees via l'API
 * ET les donnees brutes en base.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { randomUUID } from 'crypto'

// Variables de module (reinitialisees dans beforeEach)
let openDatabase, getDb, lockVault, setupMasterPassword, verifyMasterPassword
let addAccount, getAllAccounts, updateAccount, deleteAccount
let toggleFavorite, importAccounts, exportEncryptedVault, importEncryptedVault
let encrypt

beforeEach(async () => {
  vi.resetModules()
  const db = await import('../../src/main/database.js')
  const auth = await import('../../src/main/auth.js')
  const accounts = await import('../../src/main/accounts.js')
  const cryptoModule = await import('../../src/main/crypto.js')

  openDatabase = db.openDatabase
  getDb = db.getDb
  encrypt = cryptoModule.encrypt
  lockVault = auth.lockVault
  setupMasterPassword = auth.setupMasterPassword
  verifyMasterPassword = auth.verifyMasterPassword
  addAccount = accounts.addAccount
  getAllAccounts = accounts.getAllAccounts
  updateAccount = accounts.updateAccount
  deleteAccount = accounts.deleteAccount
  toggleFavorite = accounts.toggleFavorite
  importAccounts = accounts.importAccounts
  exportEncryptedVault = accounts.exportEncryptedVault
  importEncryptedVault = accounts.importEncryptedVault

  openDatabase(':memory:')
  setupMasterPassword('master-test-password')
  await verifyMasterPassword('master-test-password')
})

afterEach(() => lockVault())

const SAMPLE = {
  title: 'GitHub',
  url: 'https://github.com',
  login: 'user@example.com',
  password: 'SuperPass123!',
  category: 'Dev',
  custom_fields: [],
  totp_secret: null
}

// ─── addAccount ───────────────────────────────────────────────────────────

describe('addAccount', () => {
  it('retourne un UUID valide', () => {
    const id = addAccount(SAMPLE)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('chiffre les donnees sensibles en base (pas de texte clair)', () => {
    addAccount(SAMPLE)
    const raw = getDb().prepare('SELECT password, url, login FROM accounts').get()
    expect(raw.password).not.toBe(SAMPLE.password)
    expect(raw.url).not.toBe(SAMPLE.url)
    expect(raw.login).not.toBe(SAMPLE.login)
    expect(raw.password.split(':').length).toBe(3)
    expect(raw.url.split(':').length).toBe(3)
    expect(raw.login.split(':').length).toBe(3)
  })

  it('getAllAccounts retourne les valeurs dechiffrees correctement', () => {
    addAccount(SAMPLE)
    const [acc] = getAllAccounts()
    expect(acc.title).toBe('GitHub')
    expect(acc.url).toBe('https://github.com')
    expect(acc.login).toBe('user@example.com')
    expect(acc.password).toBe('SuperPass123!')
    expect(acc.category).toBe('Dev')
  })

  it('initialise is_favorite a 0', () => {
    addAccount(SAMPLE)
    expect(getAllAccounts()[0].is_favorite).toBe(0)
  })

  it('utilise "Autres" comme categorie par defaut si non fournie', () => {
    addAccount({ ...SAMPLE, category: undefined })
    expect(getAllAccounts()[0].category).toBe('Autres')
  })

  it('stocke created_at et passwordUpdatedAt en ISO 8601', () => {
    addAccount(SAMPLE)
    const acc = getAllAccounts()[0]
    expect(new Date(acc.createdAt).toISOString()).toBe(acc.createdAt)
    expect(new Date(acc.passwordUpdatedAt).toISOString()).toBe(acc.passwordUpdatedAt)
  })

  it('created_at === passwordUpdatedAt a la creation', () => {
    addAccount(SAMPLE)
    const acc = getAllAccounts()[0]
    expect(acc.createdAt).toBe(acc.passwordUpdatedAt)
  })

  it('stocke les custom_fields chiffres et les retourne dechiffres', () => {
    const fields = [{ label: 'PIN', value: '1234' }]
    addAccount({ ...SAMPLE, custom_fields: fields })
    const acc = getAllAccounts()[0]
    expect(acc.custom_fields).toEqual(fields)
    const raw = getDb().prepare('SELECT custom_fields FROM accounts').get()
    expect(raw.custom_fields).not.toContain('1234')
  })

  it('gere url et login vides sans erreur', () => {
    addAccount({ ...SAMPLE, url: '', login: '' })
    const acc = getAllAccounts()[0]
    expect(acc.url).toBe('')
    expect(acc.login).toBe('')
  })

  it('peut ajouter plusieurs comptes independamment', () => {
    addAccount(SAMPLE)
    addAccount({ ...SAMPLE, title: 'Notion' })
    addAccount({ ...SAMPLE, title: 'Linear' })
    expect(getAllAccounts()).toHaveLength(3)
  })
})

// ─── addAccount avec TOTP ─────────────────────────────────────────────────

describe('addAccount - TOTP', () => {
  it('stocke et restitue un secret TOTP dechiffre', () => {
    const id = addAccount({ ...SAMPLE, totp_secret: 'JBSWY3DPEHPK3PXP' })
    const acc = getAllAccounts().find((a) => a.id === id)
    expect(acc.totp_secret).toBe('JBSWY3DPEHPK3PXP')
  })

  it('normalise le secret TOTP : supprime espaces + met en majuscules', () => {
    const id = addAccount({ ...SAMPLE, totp_secret: 'jbsw y3dp' })
    const acc = getAllAccounts().find((a) => a.id === id)
    expect(acc.totp_secret).toBe('JBSWY3DP')
  })

  it('stocke null si totp_secret est null', () => {
    const id = addAccount({ ...SAMPLE, totp_secret: null })
    const acc = getAllAccounts().find((a) => a.id === id)
    expect(acc.totp_secret).toBeNull()
  })

  it('chiffre le secret TOTP en base', () => {
    addAccount({ ...SAMPLE, totp_secret: 'JBSWY3DPEHPK3PXP' })
    const raw = getDb().prepare('SELECT totp_secret FROM accounts').get()
    expect(raw.totp_secret).not.toBe('JBSWY3DPEHPK3PXP')
    expect(raw.totp_secret.split(':').length).toBe(3)
  })
})

// ─── getAllAccounts ────────────────────────────────────────────────────────

describe('getAllAccounts', () => {
  it('retourne un tableau vide sur un coffre vide', () => {
    expect(getAllAccounts()).toEqual([])
  })

  it('retourne les comptes tries par created_at DESC', async () => {
    addAccount({ ...SAMPLE, title: 'Premier' })
    await new Promise((r) => setTimeout(r, 5))
    addAccount({ ...SAMPLE, title: 'Deuxieme' })
    const accounts = getAllAccounts()
    expect(accounts[0].title).toBe('Deuxieme')
    expect(accounts[1].title).toBe('Premier')
  })

  it("leve 'Vault is locked' si le coffre est verrouille", () => {
    lockVault()
    expect(() => getAllAccounts()).toThrow('Vault is locked')
  })

  it('marque decryptError a false pour des comptes valides', () => {
    addAccount(SAMPLE)
    const [acc] = getAllAccounts()
    expect(acc.decryptError).toBe(false)
  })
})

// ─── updateAccount ────────────────────────────────────────────────────────

describe('updateAccount', () => {
  let id

  beforeEach(() => {
    id = addAccount(SAMPLE)
  })

  it('met a jour les champs texte correctement', () => {
    updateAccount(id, { ...SAMPLE, title: 'GitLab', login: 'nouveau@example.com' })
    const acc = getAllAccounts().find((a) => a.id === id)
    expect(acc.title).toBe('GitLab')
    expect(acc.login).toBe('nouveau@example.com')
  })

  it('met a jour la categorie', () => {
    updateAccount(id, { ...SAMPLE, category: 'Perso' })
    expect(getAllAccounts().find((a) => a.id === id).category).toBe('Perso')
  })

  it('met a jour password_updated_at quand le mot de passe change', async () => {
    const before = getAllAccounts().find((a) => a.id === id).passwordUpdatedAt
    await new Promise((r) => setTimeout(r, 10))
    updateAccount(id, { ...SAMPLE, password: 'NouveauPassword999!' })
    const after = getAllAccounts().find((a) => a.id === id).passwordUpdatedAt
    expect(after).not.toBe(before)
  })

  it('ne modifie PAS password_updated_at si le mot de passe est identique', () => {
    const before = getAllAccounts().find((a) => a.id === id).passwordUpdatedAt
    updateAccount(id, { ...SAMPLE, title: 'Titre modifie' })
    const after = getAllAccounts().find((a) => a.id === id).passwordUpdatedAt
    expect(after).toBe(before)
  })

  it('met a jour les custom_fields', () => {
    const fields = [{ label: 'API Key', value: 'secret-api-key' }]
    updateAccount(id, { ...SAMPLE, custom_fields: fields })
    expect(getAllAccounts().find((a) => a.id === id).custom_fields).toEqual(fields)
  })

  it('met a jour le secret TOTP', () => {
    updateAccount(id, { ...SAMPLE, totp_secret: 'NEWTOTP2ABCDEFGH' })
    const acc = getAllAccounts().find((a) => a.id === id)
    expect(acc.totp_secret).toBe('NEWTOTP2ABCDEFGH')
  })

  it('retire le TOTP si totp_secret devient null', () => {
    const id2 = addAccount({ ...SAMPLE, totp_secret: 'JBSWY3DPEHPK3PXP' })
    updateAccount(id2, { ...SAMPLE, totp_secret: null })
    const acc = getAllAccounts().find((a) => a.id === id2)
    expect(acc.totp_secret).toBeNull()
  })

  it('retourne true', () => {
    expect(updateAccount(id, SAMPLE)).toBe(true)
  })
})

// ─── deleteAccount ────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  it('supprime le compte', () => {
    const id = addAccount(SAMPLE)
    deleteAccount(id)
    expect(getAllAccounts()).toHaveLength(0)
  })

  it('ne supprime que le bon compte', () => {
    const id1 = addAccount({ ...SAMPLE, title: 'A' })
    addAccount({ ...SAMPLE, title: 'B' })
    deleteAccount(id1)
    const remaining = getAllAccounts()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].title).toBe('B')
  })

  it('ne leve pas erreur sur un ID inexistant', () => {
    expect(() => deleteAccount('uuid-inexistant-000')).not.toThrow()
  })

  it('retourne true', () => {
    const id = addAccount(SAMPLE)
    expect(deleteAccount(id)).toBe(true)
  })
})

// ─── toggleFavorite ───────────────────────────────────────────────────────

describe('toggleFavorite', () => {
  let id

  beforeEach(() => {
    id = addAccount(SAMPLE)
  })

  it('passe de 0 a 1', () => {
    toggleFavorite(id, 0)
    expect(getAllAccounts().find((a) => a.id === id).is_favorite).toBe(1)
  })

  it('passe de 1 a 0', () => {
    toggleFavorite(id, 0)
    toggleFavorite(id, 1)
    expect(getAllAccounts().find((a) => a.id === id).is_favorite).toBe(0)
  })

  it('deux toggles successifs reviennent a initial', () => {
    const initial = getAllAccounts().find((a) => a.id === id).is_favorite
    toggleFavorite(id, initial)
    toggleFavorite(id, initial ? 0 : 1)
    expect(getAllAccounts().find((a) => a.id === id).is_favorite).toBe(initial)
  })

  it('retourne true', () => {
    expect(toggleFavorite(id, 0)).toBe(true)
  })
})

// ─── importAccounts ───────────────────────────────────────────────────────

describe('importAccounts', () => {
  it('importe un tableau de comptes', () => {
    importAccounts([
      { title: 'Gmail', url: 'https://gmail.com', login: 'a@b.com', password: 'pass1' },
      { title: 'Twitter', url: 'https://twitter.com', login: 'user', password: 'pass2' }
    ])
    const all = getAllAccounts()
    expect(all).toHaveLength(2)
    const titles = all.map((a) => a.title)
    expect(titles).toContain('Gmail')
    expect(titles).toContain('Twitter')
  })

  it('utilise "Imported Account" comme titre par defaut', () => {
    importAccounts([{ password: 'pass' }])
    expect(getAllAccounts()[0].title).toBe('Imported Account')
  })

  it('utilise "Autres" comme categorie par defaut', () => {
    importAccounts([{ title: 'Test', password: 'pass' }])
    expect(getAllAccounts()[0].category).toBe('Autres')
  })

  it('chiffre les mots de passe importes', () => {
    importAccounts([{ title: 'T', password: 'plaintext' }])
    const raw = getDb().prepare('SELECT password FROM accounts').get()
    expect(raw.password).not.toBe('plaintext')
    expect(raw.password.split(':').length).toBe(3)
  })

  it('retourne true', () => {
    expect(importAccounts([{ title: 'A', password: 'p' }])).toBe(true)
  })

  it('importe un tableau vide sans erreur', () => {
    expect(() => importAccounts([])).not.toThrow()
    expect(getAllAccounts()).toHaveLength(0)
  })
})

// ─── exportEncryptedVault ─────────────────────────────────────────────────

describe('exportEncryptedVault', () => {
  beforeEach(() => {
    addAccount(SAMPLE)
    addAccount({ ...SAMPLE, title: 'Notion', password: 'NotionPass!' })
  })

  it('retourne { v: 1, salt, data }', () => {
    const snap = exportEncryptedVault('export-password')
    expect(snap.v).toBe(1)
    expect(snap.salt).toMatch(/^[0-9a-f]{32}$/)
    expect(typeof snap.data).toBe('string')
  })

  it('data est au format iv:authTag:ciphertext', () => {
    const snap = exportEncryptedVault('export-password')
    expect(snap.data.split(':').length).toBe(3)
  })

  it('deux exports produisent des snapshots differents (IV aleatoire)', () => {
    const s1 = exportEncryptedVault('password')
    const s2 = exportEncryptedVault('password')
    expect(s1.data).not.toBe(s2.data)
  })
})

// ─── importEncryptedVault ─────────────────────────────────────────────────

describe('importEncryptedVault', () => {
  beforeEach(() => {
    addAccount(SAMPLE)
    addAccount({ ...SAMPLE, title: 'Notion' })
  })

  it('restaure les comptes avec le bon mot de passe', () => {
    const snap = exportEncryptedVault('export-password')
    const result = importEncryptedVault(snap, 'export-password')
    expect(result.success).toBe(true)
    expect(result.count).toBe(2)
  })

  it('les comptes restaures sont dechiffrables sans erreur', () => {
    const snap = exportEncryptedVault('export-password')
    importEncryptedVault(snap, 'export-password')
    const all = getAllAccounts()
    expect(all.length).toBeGreaterThanOrEqual(2)
    for (const acc of all) {
      expect(acc.decryptError).toBe(false)
    }
  })

  it('retourne { error: "wrong_password" } avec un mauvais mot de passe', () => {
    const snap = exportEncryptedVault('correct-password')
    expect(importEncryptedVault(snap, 'wrong-password')).toEqual({ error: 'wrong_password' })
  })

  it('retourne { error: "invalid_file" } si payload est null', () => {
    expect(importEncryptedVault(null, 'pass')).toEqual({ error: 'invalid_file' })
  })

  it('retourne { error: "invalid_file" } si version != 1', () => {
    expect(importEncryptedVault({ v: 2, salt: 'abc', data: 'xyz' }, 'pass')).toEqual({
      error: 'invalid_file'
    })
  })

  it('retourne { error: "invalid_file" } si payload est undefined', () => {
    expect(importEncryptedVault(undefined, 'pass')).toEqual({ error: 'invalid_file' })
  })
})

// ─── Donnees corrompues / legacy ──────────────────────────────────────────

describe('Resilience : donnees corrompues ou legacy', () => {
  it('marque decryptError=true si le mot de passe en base est corrompu', () => {
    // Insere directement un compte avec un password au bon format (3 segments)
    // mais dont les octets sont invalides pour AES-GCM -> decrypt leve une erreur
    const id = randomUUID()
    getDb()
      .prepare(
        `INSERT INTO accounts
           (id, title, url, login, password, category, is_favorite, custom_fields, created_at)
         VALUES (?, 'Corrompu', '', '', 'aabbccdd00112233:aabbccddee112233445566778899aabb:deadbeef', 'Autres', 0, '[]', datetime('now'))`
      )
      .run(id)
    const all = getAllAccounts()
    const corrupt = all.find((a) => a.id === id)
    expect(corrupt).toBeDefined()
    expect(corrupt.decryptError).toBe(true)
    expect(corrupt.password).toBe('')
  })

  it('decryptField retourne la valeur brute si url/login ne sont pas chiffres (legacy)', () => {
    // Simule des donnees avant chiffrement : url et login en texte clair
    // decryptField retourne la valeur as-is si elle ne fait pas 3 segments
    // 'https://plain.url' -> split(':') -> ['https', '//plain.url'] -> 2 segments -> retourne tel quel
    const id = randomUUID()
    const key = (() => {
      // On doit avoir une cle active : on recupere la cle via getActiveKey de auth
      // La cle est disponible car le beforeEach a fait verifyMasterPassword
      // On l'utilise pour chiffrer le password (obligatoire en base)
      return null // placeholder
    })()

    // On utilise addAccount pour creer un compte normal et on recupere la cle via encrypt
    // Puis on modifie directement les champs url et login en texte clair
    const accId = addAccount(SAMPLE)
    getDb()
      .prepare("UPDATE accounts SET url='https://plain.url', login='plain-login' WHERE id=?")
      .run(accId)

    const all = getAllAccounts()
    const legacy = all.find((a) => a.id === accId)
    expect(legacy).toBeDefined()
    // url a 2 segments quand split(':') -> retourne as-is
    expect(legacy.url).toBe('https://plain.url')
    // login n'a pas de ':' -> 1 segment -> retourne as-is
    expect(legacy.login).toBe('plain-login')
  })
})

// ─── Coffre verrouille ────────────────────────────────────────────────────

describe('Operations avec coffre verrouille', () => {
  it("addAccount leve 'Vault is locked'", () => {
    lockVault()
    expect(() => addAccount(SAMPLE)).toThrow('Vault is locked')
  })

  it("updateAccount leve 'Vault is locked'", () => {
    const id = addAccount(SAMPLE)
    lockVault()
    expect(() => updateAccount(id, SAMPLE)).toThrow('Vault is locked')
  })

  it("getAllAccounts leve 'Vault is locked'", () => {
    lockVault()
    expect(() => getAllAccounts()).toThrow('Vault is locked')
  })
})
