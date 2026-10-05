import { getDb } from './database.js'
import { generateSalt, deriveKey, encrypt, decrypt, getDefaultIterations } from './crypto.js'
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

function isCiphertext(value) {
  return typeof value === 'string' && value.split(':').length === 3
}

export function encryptLegacyPlaintextFields() {
  const key = getActiveKey()
  const rows = getDb().prepare('SELECT id, title, category, tags FROM accounts').all()
  const update = getDb().prepare(
    'UPDATE accounts SET title = ?, category = ?, tags = ? WHERE id = ?'
  )
  let count = 0
  const run = getDb().transaction(() => {
    for (const row of rows) {
      const needsTitle = !isCiphertext(row.title)
      const needsCategory = !isCiphertext(row.category)
      const needsTags = !isCiphertext(row.tags)
      if (!needsTitle && !needsCategory && !needsTags) continue
      update.run(
        needsTitle ? encrypt(row.title ?? '', key) : row.title,
        needsCategory ? encrypt(row.category || 'Autres', key) : row.category,
        needsTags ? encrypt(row.tags || '[]', key) : row.tags,
        row.id
      )
      count++
    }
  })
  run()
  return count
}

export function addAccount(accountData) {
  const {
    title,
    url,
    login,
    password,
    category,
    custom_fields,
    totp_secret,
    tags,
    folder_id,
    entry_type,
    notes
  } = accountData
  const key = getActiveKey()

  const type = entry_type === 'note' ? 'note' : 'login'
  const encryptedPassword = encrypt(password || '', key)
  const encryptedUrl = encrypt(url || '', key)
  const encryptedLogin = encrypt(login || '', key)
  const encryptedTitle = encrypt(title || '', key)
  const encryptedCategory = encrypt(category || 'Autres', key)
  const encryptedNotes = encrypt(notes || '', key)

  const customFieldsString = JSON.stringify(custom_fields || [])
  const encryptedCustomFields = encrypt(customFieldsString, key)

  const cleanSecret = totp_secret ? totp_secret.replace(/\s/g, '').toUpperCase() : null
  const encryptedTotpSecret = cleanSecret ? encrypt(cleanSecret, key) : null

  const tagsString = JSON.stringify(tags || [])
  const encryptedTags = encrypt(tagsString, key)

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const stmt = getDb().prepare(`
    INSERT INTO accounts (id, title, url, login, password, category, is_favorite, custom_fields, created_at, password_updated_at, totp_secret, tags, folder_id, entry_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    encryptedTitle,
    encryptedUrl,
    encryptedLogin,
    encryptedPassword,
    encryptedCategory,
    encryptedCustomFields,
    createdAt,
    createdAt,
    encryptedTotpSecret,
    encryptedTags,
    folder_id || null,
    type,
    encryptedNotes
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
    const decryptedTags = decryptField(row.tags, key)
    if (decryptedTags) {
      try {
        parsedTags = JSON.parse(decryptedTags)
      } catch {}
    }

    return {
      id: row.id,
      title: decryptField(row.title, key),
      url: decryptField(row.url, key),
      login: decryptField(row.login, key),
      password: decryptedPassword,
      decryptError,
      category: decryptField(row.category, key) || 'Autres',
      createdAt: row.created_at,
      passwordUpdatedAt: row.password_updated_at || row.created_at,
      is_favorite: row.is_favorite,
      custom_fields: decryptedCustomFields,
      totp_secret: decryptedTotpSecret,
      tags: parsedTags,
      folder_id: row.folder_id || null,
      entry_type: row.entry_type === 'note' ? 'note' : 'login',
      notes: decryptField(row.notes, key)
    }
  })
}

export function updateAccount(id, accountData) {
  const {
    title,
    url,
    login,
    password,
    category,
    custom_fields,
    totp_secret,
    tags,
    folder_id,
    entry_type,
    notes
  } = accountData
  const key = getActiveKey()

  const oldRow = getDb().prepare('SELECT password, entry_type FROM accounts WHERE id = ?').get(id)
  const type = entry_type === 'note' ? 'note' : oldRow?.entry_type === 'note' ? 'note' : 'login'
  let passwordUpdatedAt = null
  if (oldRow) {
    try {
      if (decrypt(oldRow.password, key) !== (password || '')) {
        passwordUpdatedAt = new Date().toISOString()
      }
    } catch {}
  }

  const encryptedPassword = encrypt(password || '', key)
  const encryptedUrl = encrypt(url || '', key)
  const encryptedLogin = encrypt(login || '', key)
  const encryptedTitle = encrypt(title || '', key)
  const encryptedCategory = encrypt(category || 'Autres', key)
  const encryptedNotes = encrypt(notes || '', key)
  const customFieldsString = JSON.stringify(custom_fields || [])
  const encryptedCustomFields = encrypt(customFieldsString, key)

  const cleanSecret = totp_secret ? totp_secret.replace(/\s/g, '').toUpperCase() : null
  const encryptedTotpSecret = cleanSecret ? encrypt(cleanSecret, key) : null

  const tagsString = JSON.stringify(tags || [])
  const encryptedTags = encrypt(tagsString, key)

  if (passwordUpdatedAt) {
    getDb()
      .prepare(
        `UPDATE accounts SET title=?, url=?, login=?, password=?, category=?, custom_fields=?, password_updated_at=?, totp_secret=?, tags=?, folder_id=?, entry_type=?, notes=? WHERE id=?`
      )
      .run(
        encryptedTitle,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        encryptedCategory,
        encryptedCustomFields,
        passwordUpdatedAt,
        encryptedTotpSecret,
        encryptedTags,
        folder_id || null,
        type,
        encryptedNotes,
        id
      )
  } else {
    getDb()
      .prepare(
        `UPDATE accounts SET title=?, url=?, login=?, password=?, category=?, custom_fields=?, totp_secret=?, tags=?, folder_id=?, entry_type=?, notes=? WHERE id=?`
      )
      .run(
        encryptedTitle,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        encryptedCategory,
        encryptedCustomFields,
        encryptedTotpSecret,
        encryptedTags,
        folder_id || null,
        type,
        encryptedNotes,
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

export function deleteAllAccounts() {
  getActiveKey()
  return getDb().prepare('DELETE FROM accounts').run().changes
}

export function importAccounts(accountsArray) {
  const key = getActiveKey()

  const insert = getDb().prepare(`
    INSERT INTO accounts (id, title, url, login, password, category, is_favorite, custom_fields, created_at, entry_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `)

  const insertMany = getDb().transaction((accounts) => {
    for (const acc of accounts) {
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()

      const type = acc.entry_type === 'note' ? 'note' : 'login'
      const title = acc.title || 'Imported Account'
      const url = type === 'note' ? '' : resolveImportUrl({ ...acc, title })
      const login = acc.login || ''
      const password = acc.password || ''
      const category = acc.category || 'Autres'
      const customFieldsString = JSON.stringify(acc.custom_fields || [])
      const encryptedCustomFields = encrypt(customFieldsString, key)
      const encryptedPassword = encrypt(password, key)
      const encryptedUrl = encrypt(url, key)
      const encryptedLogin = encrypt(login, key)
      const encryptedTitle = encrypt(title, key)
      const encryptedCategory = encrypt(category, key)
      const encryptedNotes = encrypt(acc.notes || '', key)

      insert.run(
        id,
        encryptedTitle,
        encryptedUrl,
        encryptedLogin,
        encryptedPassword,
        encryptedCategory,
        encryptedCustomFields,
        createdAt,
        type,
        encryptedNotes
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
  const iterations = getDefaultIterations()
  const key = deriveKey(password, salt, iterations)
  const data = encrypt(json, key)
  return { v: 1, salt, iterations, data }
}

export function importEncryptedVault(payload, password) {
  if (!payload || payload.v !== 1) return { error: 'invalid_file' }
  const key = deriveKey(password, payload.salt, payload.iterations || 100000)
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
      const derived = deriveDomainFromTitle(decryptField(row.title, key))
      if (!derived) continue
      update.run(encrypt(derived, key), row.id)
      count++
    }
  })
  run()
  return count
}

export function previewMissingUrls() {
  const key = getActiveKey()
  const rows = getDb().prepare('SELECT id, title, url, entry_type FROM accounts').all()
  const suggestions = []
  for (const row of rows) {
    if (row.entry_type === 'note') continue
    const current = decryptField(row.url, key)
    if (current && current.trim()) continue
    const title = decryptField(row.title, key)
    const domain = deriveDomainFromTitle(title)
    if (!domain) continue
    suggestions.push({ id: row.id, title, url: `https://${domain}` })
  }
  return suggestions
}

export function applyUrls(updates) {
  if (!Array.isArray(updates)) return 0
  const key = getActiveKey()
  const getRow = getDb().prepare('SELECT url FROM accounts WHERE id = ?')
  const update = getDb().prepare('UPDATE accounts SET url = ? WHERE id = ?')
  let count = 0
  const run = getDb().transaction(() => {
    for (const u of updates) {
      if (!u || !u.id || typeof u.url !== 'string' || !u.url.trim()) continue
      const row = getRow.get(u.id)
      if (!row) continue
      const existing = decryptField(row.url, key)
      if (existing && existing.trim()) continue
      update.run(encrypt(u.url.trim(), key), u.id)
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
