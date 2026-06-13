import { getDb } from './database.js'
import { generateSalt, deriveKey, encrypt, decrypt } from './crypto.js'
import { getActiveKey } from './auth'
import { resolveImportUrl, deriveDomainFromTitle } from './urlderive.js'
import crypto from 'node:crypto'

function decryptField(value, key) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.split(':').length !== 3) return value
  try {
    return decrypt(value, key)
  } catch {
    return ''
  }
}

export function addAccount(accountData) {
  const { title, url, login, password, category, custom_fields, totp_secret, tags, folder_id } =
    accountData
  const key = getActiveKey()

  const encryptedPassword = encrypt(password, key)
  const encryptedUrl = encrypt(url || '', key)
  const encryptedLogin = encrypt(login || '', key)

  const customFieldsString = JSON.stringify(custom_fields || [])
  const encryptedCustomFields = encrypt(customFieldsString, key)

  const cleanSecret = totp_secret ? totp_secret.replace(/\s/g, '').toUpperCase() : null
  const encryptedTotpSecret = cleanSecret ? encrypt(cleanSecret, key) : null

  const tagsString = JSON.stringify(tags || [])

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const stmt = getDb().prepare(`
    INSERT INTO accounts (id, title, url, login, password, category, is_favorite, custom_fields, created_at, password_updated_at, totp_secret, tags, folder_id)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    title,
    encryptedUrl,
    encryptedLogin,
    encryptedPassword,
    category || 'Autres',
    encryptedCustomFields,
    createdAt,
    createdAt,
    encryptedTotpSecret,
    tagsString,
    folder_id || null
  )
  return id
}

export function getAllAccounts() {
  const key = getActiveKey()
  const rows = getDb().prepare(`SELECT * FROM accounts ORDER BY created_at DESC`).all()

  return rows.map((row) => {
    let decryptedCustomFields = []
    if (row.custom_fields) {
      try {
        const decryptedString = decrypt(row.custom_fields, key)
        decryptedCustomFields = JSON.parse(decryptedString)
      } catch {
        console.error("Erreur de déchiffrement des custom_fields pour l'ID", row.id)
      }
    }

    let decryptedTotpSecret = null
    if (row.totp_secret) {
      try {
        decryptedTotpSecret = decrypt(row.totp_secret, key)
      } catch {
        console.error("Erreur de déchiffrement du totp_secret pour l'ID", row.id)
      }
    }

    let decryptedPassword = ''
    let decryptError = false
    try {
      decryptedPassword = decrypt(row.password, key)
    } catch {
      decryptError = true
      console.error("Erreur de déchiffrement du mot de passe pour l'ID", row.id)
    }

    let parsedTags = []
    if (row.tags) {
      try {
        parsedTags = JSON.parse(row.tags)
      } catch {}
    }

    return {
      id: row.id,
      title: row.title,
      url: decryptField(row.url, key),
      login: decryptField(row.login, key),
      password: decryptedPassword,
      decryptError,
      category: row.category,
      createdAt: row.created_at,
      passwordUpdatedAt: row.password_updated_at || row.created_at,
      is_favorite: row.is_favorite,
      custom_fields: decryptedCustomFields,
      totp_secret: decryptedTotpSecret,
      tags: parsedTags,
      folder_id: row.folder_id || null
    }
  })
}

export function updateAccount(id, accountData) {
  const { title, url, login, password, category, custom_fields, totp_secret, tags, folder_id } =
    accountData
  const key = getActiveKey()

  const oldRow = getDb().prepare('SELECT password FROM accounts WHERE id = ?').get(id)
  let passwordUpdatedAt = null
  if (oldRow) {
    try {
      if (decrypt(oldRow.password, key) !== password) {
        passwordUpdatedAt = new Date().toISOString()
      }
    } catch {}
  }

  const encryptedPassword = encrypt(password, key)
  const encryptedUrl = encrypt(url || '', key)
  const encryptedLogin = encrypt(login || '', key)
  const customFieldsString = JSON.stringify(custom_fields || [])
  const encryptedCustomFields = encrypt(customFieldsString, key)

  const cleanSecret = totp_secret ? totp_secret.replace(/\s/g, '').toUpperCase() : null
  const encryptedTotpSecret = cleanSecret ? encrypt(cleanSecret, key) : null

  const tagsString = JSON.stringify(tags || [])

  if (passwordUpdatedAt) {
    getDb()
      .prepare(
        `UPDATE accounts SET title=?, url=?, login=?, password=?, category=?, custom_fields=?, password_updated_at=?, totp_secret=?, tags=?, folder_id=? WHERE id=?`
      )
      .run(
        title,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        category || 'Autres',
        encryptedCustomFields,
        passwordUpdatedAt,
        encryptedTotpSecret,
        tagsString,
        folder_id || null,
        id
      )
  } else {
    getDb()
      .prepare(
        `UPDATE accounts SET title=?, url=?, login=?, password=?, category=?, custom_fields=?, totp_secret=?, tags=?, folder_id=? WHERE id=?`
      )
      .run(
        title,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        category || 'Autres',
        encryptedCustomFields,
        encryptedTotpSecret,
        tagsString,
        folder_id || null,
        id
      )
  }

  return true
}

export function deleteAccount(id) {
  const stmt = getDb().prepare('DELETE FROM accounts WHERE id = ?')
  stmt.run(id)
  return true
}

export function importAccounts(accountsArray) {
  const key = getActiveKey()

  const insert = getDb().prepare(`
    INSERT INTO accounts (id, title, url, login, password, category, is_favorite, custom_fields, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `)

  const insertMany = getDb().transaction((accounts) => {
    for (const acc of accounts) {
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()

      const title = acc.title || 'Imported Account'
      const url = resolveImportUrl({ ...acc, title })
      const login = acc.login || ''
      const password = acc.password || ''
      const category = acc.category || 'Autres'
      const customFieldsString = JSON.stringify(acc.custom_fields || [])
      const encryptedCustomFields = encrypt(customFieldsString, key)
      const encryptedPassword = encrypt(password, key)
      const encryptedUrl = encrypt(url, key)
      const encryptedLogin = encrypt(login, key)

      insert.run(
        id,
        title,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        category,
        encryptedCustomFields,
        createdAt
      )
    }
  })

  insertMany(accountsArray)
  return true
}

export function exportEncryptedVault(password) {
  const accounts = getAllAccounts()
  const json = JSON.stringify(accounts)
  const salt = generateSalt()
  const key = deriveKey(password, salt)
  const data = encrypt(json, key)
  return { v: 1, salt, data }
}

export function importEncryptedVault(payload, password) {
  if (!payload || payload.v !== 1) return { error: 'invalid_file' }
  const key = deriveKey(password, payload.salt)
  let json
  try {
    json = decrypt(payload.data, key)
  } catch {
    return { error: 'wrong_password' }
  }
  const accounts = JSON.parse(json)
  importAccounts(accounts)
  return { success: true, count: accounts.length }
}

export function backfillMissingUrls() {
  const key = getActiveKey()
  const rows = getDb().prepare('SELECT id, title, url FROM accounts').all()
  const update = getDb().prepare('UPDATE accounts SET url = ? WHERE id = ?')
  let count = 0
  const run = getDb().transaction(() => {
    for (const row of rows) {
      const current = decryptField(row.url, key)
      if (current && current.trim()) continue
      const derived = deriveDomainFromTitle(row.title)
      if (!derived) continue
      update.run(encrypt(derived, key), row.id)
      count++
    }
  })
  run()
  return count
}

export function toggleFavorite(id, currentStatus) {
  const newStatus = currentStatus ? 0 : 1

  const stmt = getDb().prepare(`
    UPDATE accounts 
    SET is_favorite = ?
    WHERE id = ?
  `)

  stmt.run(newStatus, id)
  return true
}
