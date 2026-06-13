import { getDb } from './database.js'
import crypto from 'node:crypto'

export function getFolders() {
  return getDb().prepare('SELECT * FROM folders ORDER BY sort_order ASC, name ASC').all()
}

export function addFolder(name, parentId = null) {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const maxRow = getDb().prepare('SELECT MAX(sort_order) as m FROM folders').get()
  const sortOrder = (maxRow?.m ?? -1) + 1
  getDb()
    .prepare('INSERT INTO folders (id, name, parent_id, created_at, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, parentId ?? null, createdAt, sortOrder)
  return id
}

export function updateFolder(id, name) {
  getDb().prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, id)
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
