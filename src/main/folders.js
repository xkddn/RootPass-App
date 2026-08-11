import { getDb } from './database.js'
import { encrypt, decrypt } from './crypto.js'
import { getActiveKey } from './auth.js'
import crypto from 'node:crypto'

function decryptName(value, key) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.split(':').length !== 3) return value
  try {
    return decrypt(value, key)
  } catch {
    return ''
  }
}

export function encryptLegacyFolderNames() {
  const key = getActiveKey()
  const rows = getDb().prepare('SELECT id, name FROM folders').all()
  const update = getDb().prepare('UPDATE folders SET name = ? WHERE id = ?')
  let count = 0
  const run = getDb().transaction(() => {
    for (const row of rows) {
      if (typeof row.name === 'string' && row.name.split(':').length === 3) continue
      update.run(encrypt(row.name ?? '', key), row.id)
      count++
    }
  })
  run()
  return count
}

export function getFolders() {
  const key = getActiveKey()
  const rows = getDb().prepare('SELECT * FROM folders').all()
  return rows
    .map((row) => ({ ...row, name: decryptName(row.name, key) }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
}

export function addFolder(name, parentId = null) {
  const key = getActiveKey()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const maxRow = getDb().prepare('SELECT MAX(sort_order) as m FROM folders').get()
  const sortOrder = (maxRow?.m ?? -1) + 1
  getDb()
    .prepare('INSERT INTO folders (id, name, parent_id, created_at, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, encrypt(name, key), parentId ?? null, createdAt, sortOrder)
  return id
}

export function updateFolder(id, name) {
  const key = getActiveKey()
  getDb().prepare('UPDATE folders SET name = ? WHERE id = ?').run(encrypt(name, key), id)
  return true
}

export function deleteFolder(id) {
  getDb().prepare('UPDATE accounts SET folder_id = NULL WHERE folder_id = ?').run(id)
  getDb().prepare('DELETE FROM folders WHERE id = ?').run(id)
  return true
}

export function reorderFolders(orderedIds) {
  const update = getDb().prepare('UPDATE folders SET sort_order = ? WHERE id = ?')
  const tx = getDb().transaction((ids) => {
    ids.forEach((id, index) => update.run(index, id))
  })
  tx(orderedIds)
  return true
}
