import { getDb } from './database.js'
import { generateSalt, deriveKey, encrypt, decrypt, getDefaultIterations } from './crypto.js'

const ENCRYPTED_ACCOUNT_COLUMNS = [
  'password',
  'url',
  'login',
  'title',
  'category',
  'tags',
  'custom_fields',
  'totp_secret'
]
const ENCRYPTED_FOLDER_COLUMNS = ['name']

// PAS TOUCHER
const CANARY_TEXT = 'rootpass.vault.canary.v1'

let activeKey = null

let failedAttempts = 0
const FREE_ATTEMPTS = 5
const MAX_DELAY_MS = 5000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getActiveKey() {
  if (!activeKey) throw new Error('Vault is locked')
  return activeKey
}

export function lockVault() {
  activeKey = null
}

export function isVaultUnlocked() {
  return activeKey !== null
}

export function isVaultInitialized() {
  const row = getDb().prepare('SELECT id FROM master_check WHERE id = 1').get()
  return !!row
}

export function setupMasterPassword(password) {
  const salt = generateSalt()
  const iterations = getDefaultIterations()

  const key = deriveKey(password, salt, iterations)

  const encryptedCanary = encrypt(CANARY_TEXT, key)

  const stmt = getDb().prepare(
    'INSERT INTO master_check (id, salt, canary, iterations) VALUES (1, ?, ?, ?)'
  )
  stmt.run(salt, encryptedCanary, iterations)

  return true
}

export function getMasterHint() {
  const row = getDb().prepare('SELECT hint FROM master_check WHERE id = 1').get()
  return row?.hint ?? null
}

export function setMasterHint(hint) {
  getDb()
    .prepare('UPDATE master_check SET hint = ? WHERE id = 1')
    .run(hint && hint.trim() ? hint.trim() : null)
  return true
}

export async function verifyMasterPassword(password) {
  const row = getDb()
    .prepare('SELECT salt, canary, iterations FROM master_check WHERE id = 1')
    .get()

  if (!row) {
    throw new Error('Coffre-fort non initialisé')
  }

  if (failedAttempts >= FREE_ATTEMPTS) {
    const delay = Math.min((failedAttempts - FREE_ATTEMPTS + 1) * 1000, MAX_DELAY_MS)
    await sleep(delay)
  }

  const key = deriveKey(password, row.salt, row.iterations || 100000)

  try {
    const decryptedText = decrypt(row.canary, key)

    if (decryptedText === CANARY_TEXT) {
      activeKey = key
      failedAttempts = 0
      return true
    }
    failedAttempts++
    return null
  } catch {
    failedAttempts++
    return null
  }
}

export function changeMasterPassword(oldPassword, newPassword) {
  const db = getDb()
  const row = db.prepare('SELECT salt, canary, iterations FROM master_check WHERE id = 1').get()
  if (!row) throw new Error('Coffre-fort non initialisé')

  const oldKey = deriveKey(oldPassword, row.salt, row.iterations || 100000)
  try {
    if (decrypt(row.canary, oldKey) !== CANARY_TEXT) return { error: 'wrong_password' }
  } catch {
    return { error: 'wrong_password' }
  }

  const newSalt = generateSalt()
  const newIterations = getDefaultIterations()
  const newKey = deriveKey(newPassword, newSalt, newIterations)

  const reencrypt = (value) => {
    if (value == null) return value
    if (typeof value !== 'string' || value.split(':').length !== 3) {
      return encrypt(value, newKey)
    }
    try {
      return encrypt(decrypt(value, oldKey), newKey)
    } catch {
      return encrypt('', newKey)
    }
  }

  const accountRows = db
    .prepare(`SELECT id, ${ENCRYPTED_ACCOUNT_COLUMNS.join(', ')} FROM accounts`)
    .all()
  const updateAccountStmt = db.prepare(
    `UPDATE accounts SET ${ENCRYPTED_ACCOUNT_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`
  )
  const folderRows = db
    .prepare(`SELECT id, ${ENCRYPTED_FOLDER_COLUMNS.join(', ')} FROM folders`)
    .all()
  const updateFolderStmt = db.prepare(
    `UPDATE folders SET ${ENCRYPTED_FOLDER_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`
  )
  const updateMasterStmt = db.prepare(
    'UPDATE master_check SET salt = ?, canary = ?, iterations = ? WHERE id = 1'
  )

  const run = db.transaction(() => {
    for (const acc of accountRows) {
      updateAccountStmt.run(
        ...ENCRYPTED_ACCOUNT_COLUMNS.map((c) => reencrypt(acc[c])),
        acc.id
      )
    }
    for (const folder of folderRows) {
      updateFolderStmt.run(
        ...ENCRYPTED_FOLDER_COLUMNS.map((c) => reencrypt(folder[c])),
        folder.id
      )
    }
    updateMasterStmt.run(newSalt, encrypt(CANARY_TEXT, newKey), newIterations)
  })
  run()

  activeKey = newKey
  return { success: true }
}
