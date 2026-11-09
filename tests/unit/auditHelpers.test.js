/**
 * Tests unitaires - src/renderer/src/utils/auditHelpers.js
 *
 * Logique pure de l'audit de securite :
 * mots de passe faibles, doublons, anciens (> 90 jours).
 */
import { describe, it, expect } from 'vitest'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeOldAccounts,
  computeTotalIssues,
  computeFlaggedIds,
  computeTwinGroups,
  siteKey,
  MS_90_DAYS
} from '../../src/renderer/src/utils/auditHelpers.js'

// Helpers pour creer des comptes de test
const DAY_MS = 24 * 60 * 60 * 1000
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS).toISOString()
const makeAccount = (overrides) => ({
  id: Math.random().toString(36).slice(2),
  title: 'Compte',
  login: 'user@test.com',
  password: 'Password1',
  category: 'Autres',
  createdAt: daysAgo(0),
  passwordUpdatedAt: daysAgo(0),
  is_favorite: 0,
  custom_fields: [],
  totp_secret: null,
  ...overrides
})

// ─── MS_90_DAYS ───────────────────────────────────────────────────────────

describe('MS_90_DAYS', () => {
  it('vaut exactement 90 * 24 * 60 * 60 * 1000 ms', () => {
    expect(MS_90_DAYS).toBe(90 * 24 * 60 * 60 * 1000)
  })
})

// ─── computeWeakAccounts ─────────────────────────────────────────────────

describe('computeWeakAccounts', () => {
  it('retourne [] sur liste vide', () => {
    expect(computeWeakAccounts([])).toEqual([])
  })

  it('detecte un mot de passe faible (strength = 1)', () => {
    const weak = makeAccount({ password: 'abc' })
    const result = computeWeakAccounts([weak])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(weak.id)
  })

  it('exclut les mots de passe forts', () => {
    const strong = makeAccount({ password: 'Str0ng#Pass!Word' })
    expect(computeWeakAccounts([strong])).toHaveLength(0)
  })

  it('exclut les mots de passe moyens (strength = 2)', () => {
    const medium = makeAccount({ password: 'Password1' })
    expect(computeWeakAccounts([medium])).toHaveLength(0)
  })

  it('filtre correctement un melange', () => {
    const accounts = [
      makeAccount({ password: 'abc' }), // faible
      makeAccount({ password: '123' }), // faible
      makeAccount({ password: 'Str0ng#Pass!Word' }) // fort
    ]
    expect(computeWeakAccounts(accounts)).toHaveLength(2)
  })

  it('gere les mots de passe vides sans crash', () => {
    const acc = makeAccount({ password: '' })
    expect(() => computeWeakAccounts([acc])).not.toThrow()
  })
})

// ─── computeDuplicateGroups ───────────────────────────────────────────────

describe('computeDuplicateGroups', () => {
  it('retourne [] si aucun doublon', () => {
    const accounts = [
      makeAccount({ password: 'pass1' }),
      makeAccount({ password: 'pass2' }),
      makeAccount({ password: 'pass3' })
    ]
    expect(computeDuplicateGroups(accounts)).toEqual([])
  })

  it('groupe les comptes avec le meme mot de passe', () => {
    const a1 = makeAccount({ password: 'shared' })
    const a2 = makeAccount({ password: 'shared' })
    const a3 = makeAccount({ password: 'unique' })
    const groups = computeDuplicateGroups([a1, a2, a3])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(2)
    const ids = groups[0].map((a) => a.id)
    expect(ids).toContain(a1.id)
    expect(ids).toContain(a2.id)
  })

  it('cree un groupe par mot de passe partage', () => {
    const a1 = makeAccount({ password: 'groupA' })
    const a2 = makeAccount({ password: 'groupA' })
    const a3 = makeAccount({ password: 'groupB' })
    const a4 = makeAccount({ password: 'groupB' })
    const groups = computeDuplicateGroups([a1, a2, a3, a4])
    expect(groups).toHaveLength(2)
  })

  it('ignore les comptes sans mot de passe', () => {
    const a1 = makeAccount({ password: '' })
    const a2 = makeAccount({ password: '' })
    expect(computeDuplicateGroups([a1, a2])).toHaveLength(0)
  })

  it('retourne [] sur liste vide', () => {
    expect(computeDuplicateGroups([])).toEqual([])
  })

  it('3 comptes avec le meme mot de passe forment 1 groupe de 3', () => {
    const accounts = [
      makeAccount({ password: 'same' }),
      makeAccount({ password: 'same' }),
      makeAccount({ password: 'same' })
    ]
    const groups = computeDuplicateGroups(accounts)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(3)
  })
})

// ─── computeOldAccounts ───────────────────────────────────────────────────

describe('computeOldAccounts', () => {
  it('retourne [] sur liste vide', () => {
    expect(computeOldAccounts([])).toEqual([])
  })

  it('detecte un compte avec password > 90 jours', () => {
    const old = makeAccount({ passwordUpdatedAt: daysAgo(91) })
    const result = computeOldAccounts([old])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(old.id)
  })

  it('exclut un compte avec password < 90 jours', () => {
    const recent = makeAccount({ passwordUpdatedAt: daysAgo(30) })
    expect(computeOldAccounts([recent])).toHaveLength(0)
  })

  it('exclut un compte a exactement 90 jours (cutoff exclusif)', () => {
    const now = Date.now()
    const cutoff = now - MS_90_DAYS
    const exact = makeAccount({ passwordUpdatedAt: new Date(cutoff + 1000).toISOString() })
    expect(computeOldAccounts([exact], now)).toHaveLength(0)
  })

  it('utilise passwordUpdatedAt en priorite sur createdAt', () => {
    const acc = makeAccount({
      createdAt: daysAgo(200),
      passwordUpdatedAt: daysAgo(10) // recemment mis a jour
    })
    expect(computeOldAccounts([acc])).toHaveLength(0)
  })

  it('utilise createdAt si passwordUpdatedAt est absent', () => {
    const acc = makeAccount({ createdAt: daysAgo(100), passwordUpdatedAt: null })
    expect(computeOldAccounts([acc])).toHaveLength(1)
  })

  it('ignore les comptes sans date', () => {
    const acc = makeAccount({ createdAt: null, passwordUpdatedAt: null })
    expect(() => computeOldAccounts([acc])).not.toThrow()
    expect(computeOldAccounts([acc])).toHaveLength(0)
  })

  it('accepte un parametre now personnalise', () => {
    const fixedNow = new Date('2025-01-01').getTime()
    const acc = makeAccount({
      passwordUpdatedAt:
        new Date('2024-09-01').getTime() > 0 ? new Date('2024-09-01').toISOString() : daysAgo(120)
    })
    const result = computeOldAccounts([acc], fixedNow)
    // 2025-01-01 - 2024-09-01 = ~122 jours > 90 -> doit etre detecte
    expect(result).toHaveLength(1)
  })
})

// ─── computeTotalIssues ───────────────────────────────────────────────────

describe('computeTotalIssues', () => {
  it('retourne 0 si tout est propre', () => {
    expect(computeTotalIssues([], [])).toBe(0)
  })

  it('compte correctement les comptes faibles', () => {
    const weak = [makeAccount(), makeAccount()]
    expect(computeTotalIssues(weak, [])).toBe(2)
  })

  it('compte le nombre de comptes dans les groupes de doublons (pas le nombre de groupes)', () => {
    // 1 groupe de 3 comptes -> contribue 3 issues
    const group = [makeAccount(), makeAccount(), makeAccount()]
    expect(computeTotalIssues([], [group])).toBe(3)
  })

  it('ignore les mots de passe anciens', () => {
    const weak = [makeAccount()]
    const dupGroup = [makeAccount(), makeAccount()]
    expect(computeTotalIssues(weak, [dupGroup])).toBe(3)
  })

  it('ne compte qu une fois un compte a la fois faible et duplique', () => {
    const shared = makeAccount()
    const dupGroup = [shared, makeAccount()]
    expect(computeTotalIssues([shared], [dupGroup])).toBe(2)
  })
})

describe('computeFlaggedIds', () => {
  it('regroupe les ids faibles et dupliques sans doublon', () => {
    const shared = makeAccount()
    const other = makeAccount()
    const ids = computeFlaggedIds([shared], [[shared, other]])
    expect(ids.size).toBe(2)
    expect(ids.has(shared.id)).toBe(true)
    expect(ids.has(other.id)).toBe(true)
  })
})

describe('siteKey', () => {
  it("utilise le nom du domaine sans l'extension", () => {
    expect(siteKey(makeAccount({ url: 'https://github.com/login' }))).toBe('github')
    expect(siteKey(makeAccount({ url: 'accounts.google.com' }))).toBe('google')
    expect(siteKey(makeAccount({ url: 'https://www.bbc.co.uk' }))).toBe('bbc')
  })

  it("se rabat sur le titre quand il n'y a pas d'URL", () => {
    expect(siteKey(makeAccount({ url: '', title: 'Git Hub' }))).toBe('github')
  })
})

describe('computeTwinGroups', () => {
  it('regroupe un compte sans URL et un compte avec URL du même site et même identifiant', () => {
    const a = makeAccount({ title: 'GitHub', url: '', login: 'Moi@Test.com', password: 'a' })
    const b = makeAccount({
      title: 'Github',
      url: 'https://github.com',
      login: 'moi@test.com ',
      password: 'b'
    })
    const groups = computeTwinGroups([a, b])
    expect(groups).toHaveLength(1)
    expect(groups[0].reason).toBe('login')
    expect(groups[0].accounts.map((x) => x.id).sort()).toEqual([a.id, b.id].sort())
  })

  it('signale le même mot de passe sur un même site', () => {
    const a = makeAccount({ url: 'https://github.com', login: 'a@x.com', password: 'same' })
    const b = makeAccount({ url: 'https://github.com', login: 'b@x.com', password: 'same' })
    expect(computeTwinGroups([a, b])[0].reason).toBe('password')
  })

  it('indique quand identifiant et mot de passe sont identiques', () => {
    const a = makeAccount({ url: 'https://github.com', login: 'a@x.com', password: 'same' })
    const b = makeAccount({ url: 'github.com', login: 'a@x.com', password: 'same' })
    expect(computeTwinGroups([a, b])[0].reason).toBe('both')
  })

  it('ignore deux comptes distincts sur le même site', () => {
    const a = makeAccount({ url: 'https://github.com', login: 'a@x.com', password: 'p1' })
    const b = makeAccount({ url: 'https://github.com', login: 'b@x.com', password: 'p2' })
    expect(computeTwinGroups([a, b])).toEqual([])
  })

  it('ignore le même identifiant sur des sites différents', () => {
    const a = makeAccount({ url: 'https://github.com', login: 'a@x.com' })
    const b = makeAccount({ url: 'https://gitlab.com', login: 'a@x.com' })
    expect(computeTwinGroups([a, b])).toEqual([])
  })

  it('ignore les notes sécurisées', () => {
    const a = makeAccount({ url: 'https://github.com', login: 'a@x.com' })
    const b = makeAccount({ url: 'https://github.com', login: 'a@x.com', entry_type: 'note' })
    expect(computeTwinGroups([a, b])).toEqual([])
  })

  it('compte les doublons dans le total des problèmes sans compter deux fois', () => {
    const a = makeAccount({
      url: 'https://github.com',
      login: 'a@x.com',
      password: 'Str0ng!Pass#1'
    })
    const b = makeAccount({
      url: 'https://github.com',
      login: 'a@x.com',
      password: 'Str0ng!Pass#2'
    })
    const twins = computeTwinGroups([a, b])
    expect(computeTotalIssues([], [], twins)).toBe(2)
    expect(computeTotalIssues([a], [], twins)).toBe(2)
  })
})
