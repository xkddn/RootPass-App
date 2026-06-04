import { getDb } from './database.js'
import { generateSalt, deriveKey, encrypt, decrypt, getDefaultIterations } from './crypto.js'

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
