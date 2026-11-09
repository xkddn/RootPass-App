import { getDomainWithoutSuffix } from 'tldts'
import { getPasswordStrength } from './passwordGenerator'

export const MS_90_DAYS = 90 * 24 * 60 * 60 * 1000

function isLogin(acc) {
  return acc.entry_type !== 'note'
}

export function computeWeakAccounts(accounts) {
  return accounts.filter((acc) => isLogin(acc) && getPasswordStrength(acc.password) === 1)
}

export function computeDuplicateGroups(accounts) {
  const map = {}
  accounts.forEach((acc) => {
    if (!isLogin(acc) || !acc.password) return
    if (!map[acc.password]) map[acc.password] = []
    map[acc.password].push(acc)
  })
  return Object.values(map).filter((g) => g.length > 1)
}

function normName(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function normLogin(value) {
  return (value || '').trim().toLowerCase()
}

export function siteKey(acc) {
  const raw = (acc.url || '').trim()
  if (raw) {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'http://' + raw
    try {
      const host = new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '')
      if (host.includes('.')) {
        const name = normName(getDomainWithoutSuffix(host) || host.split('.')[0])
        if (name) return name
      }
    } catch {
      void 0
    }
  }
  return normName(acc.title)
}

function hasRepeat(values) {
  const seen = new Set()
  for (const v of values) {
    if (!v) continue
    if (seen.has(v)) return true
    seen.add(v)
  }
  return false
}

export function computeTwinGroups(accounts) {
  const bySite = new Map()
  accounts.forEach((acc) => {
    if (!isLogin(acc)) return
    const key = siteKey(acc)
    if (!key) return
    if (!bySite.has(key)) bySite.set(key, [])
    bySite.get(key).push(acc)
  })

  const groups = []
  bySite.forEach((list, site) => {
    if (list.length < 2) return
    const parent = list.map((_, i) => i)
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
    const link = (a, b) => {
      parent[find(a)] = find(b)
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const login = normLogin(list[i].login)
        const sameLogin = !!login && login === normLogin(list[j].login)
        const samePassword = !!list[i].password && list[i].password === list[j].password
        if (sameLogin || samePassword) link(i, j)
      }
    }
    const clusters = new Map()
    list.forEach((acc, i) => {
      const root = find(i)
      if (!clusters.has(root)) clusters.set(root, [])
      clusters.get(root).push(acc)
    })
    clusters.forEach((members) => {
      if (members.length < 2) return
      const loginShared = hasRepeat(members.map((a) => normLogin(a.login)))
      const passwordShared = hasRepeat(members.map((a) => a.password))
      const reason = loginShared && passwordShared ? 'both' : loginShared ? 'login' : 'password'
      groups.push({ site, reason, accounts: members })
    })
  })
  return groups
}

export function computeOldAccounts(accounts, now = Date.now()) {
  const cutoff = now - MS_90_DAYS
  return accounts.filter((acc) => {
    if (!isLogin(acc)) return false
    const date = acc.passwordUpdatedAt || acc.createdAt
    return date && new Date(date).getTime() < cutoff
  })
}

export function computeFlaggedIds(weakAccounts, duplicateGroups, twinGroups = []) {
  const ids = new Set(weakAccounts.map((a) => a.id))
  duplicateGroups.forEach((g) => g.forEach((a) => ids.add(a.id)))
  twinGroups.forEach((g) => g.accounts.forEach((a) => ids.add(a.id)))
  return ids
}

export function computeTotalIssues(weakAccounts, duplicateGroups, twinGroups = []) {
  return computeFlaggedIds(weakAccounts, duplicateGroups, twinGroups).size
}
