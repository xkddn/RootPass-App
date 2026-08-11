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

export function computeOldAccounts(accounts, now = Date.now()) {
  const cutoff = now - MS_90_DAYS
  return accounts.filter((acc) => {
    if (!isLogin(acc)) return false
    const date = acc.passwordUpdatedAt || acc.createdAt
    return date && new Date(date).getTime() < cutoff
  })
}

export function computeTotalIssues(weakAccounts, duplicateGroups, oldAccounts) {
  return (
    weakAccounts.length + duplicateGroups.reduce((s, g) => s + g.length, 0) + oldAccounts.length
  )
}
