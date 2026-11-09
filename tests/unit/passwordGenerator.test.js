import { describe, it, expect } from 'vitest'
import {
  generatePassword,
  generateStrongPassword,
  getPasswordStrength
} from '../../src/renderer/src/utils/passwordGenerator.js'

// Symboles definis dans le module source
const SYMBOLS = '@-!&_#'

// ─── getPasswordStrength ───────────────────────────────────────────────────

describe('getPasswordStrength', () => {
  it('retourne 0 pour une valeur vide / falsy', () => {
    expect(getPasswordStrength('')).toBe(0)
    expect(getPasswordStrength(null)).toBe(0)
    expect(getPasswordStrength(undefined)).toBe(0)
  })

  it('retourne 1 pour un mot de passe faible (score <= 2)', () => {
    expect(getPasswordStrength('abc')).toBe(1)
    expect(getPasswordStrength('12345')).toBe(1)
    expect(getPasswordStrength('AAAA')).toBe(1)
  })

  it('retourne 2 pour un mot de passe moyen (score 3-4)', () => {
    // length>=8(1) + upper(1) + lower(1) + number(1) = 4 pts -> niveau 2
    expect(getPasswordStrength('Password1')).toBe(2)
  })

  it('retourne 3 pour un mot de passe fort (score >= 5)', () => {
    // length>=16(3) + upper + lower + number + symbol = 7 pts -> niveau 3
    expect(getPasswordStrength('P@ssw0rd!LongEnough')).toBe(3)
    // length>=12(2) + upper + lower + number + symbol = 6 pts -> niveau 3
    expect(getPasswordStrength('Str0ng#Pass!')).toBe(3)
  })

  it('le score augmente avec la longueur', () => {
    const s8 = getPasswordStrength('Aa1@aaaa')
    const s12 = getPasswordStrength('Aa1@aaaaAAAA')
    const s16 = getPasswordStrength('Aa1@aaaaAAAAbbbb')
    expect(s8).toBeLessThanOrEqual(s12)
    expect(s12).toBeLessThanOrEqual(s16)
  })
})

// ─── generatePassword ─────────────────────────────────────────────────────

describe('generatePassword', () => {
  it('retourne une chaine de la longueur exacte demandee', () => {
    for (const len of [8, 12, 16, 24, 32, 64]) {
      expect(generatePassword(len).length).toBe(len)
    }
  })

  it("retourne une chaine vide si aucun charset n'est active", () => {
    const result = generatePassword(16, {
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false
    })
    expect(result).toBe('')
  })

  it('ne contient que des majuscules quand uppercase only', () => {
    const pwd = generatePassword(30, {
      uppercase: true,
      lowercase: false,
      numbers: false,
      symbols: false
    })
    expect(pwd).toMatch(/^[A-Z]+$/)
    expect(pwd.length).toBe(30)
  })

  it('ne contient que des minuscules quand lowercase only', () => {
    const pwd = generatePassword(30, {
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false
    })
    expect(pwd).toMatch(/^[a-z]+$/)
  })

  it('ne contient que des chiffres quand numbers only', () => {
    const pwd = generatePassword(30, {
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false
    })
    expect(pwd).toMatch(/^[0-9]+$/)
  })

  it('ne contient que des symboles definis quand symbols only', () => {
    const pwd = generatePassword(30, {
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: true
    })
    expect(pwd).toMatch(/^[@\-!&_#]+$/)
  })

  it('garantit au minimum 2 symboles quand symbols=true (sur 30 generations)', () => {
    for (let i = 0; i < 30; i++) {
      const pwd = generatePassword(16, {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
      })
      const count = (pwd.match(/[@\-!&_#]/g) || []).length
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  it('genere des mots de passe differents a chaque appel (entropie)', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword(16)))
    expect(passwords.size).toBeGreaterThan(1)
  })

  it('fonctionne avec toutes les options par defaut (length=16)', () => {
    const pwd = generatePassword()
    expect(pwd.length).toBe(16)
    expect(pwd).toMatch(/[A-Z]/)
    expect(pwd).toMatch(/[a-z]/)
    expect(pwd).toMatch(/[0-9]/)
  })
})

// ─── generateStrongPassword ───────────────────────────────────────────────

describe('generateStrongPassword', () => {
  it('retourne 16 caracteres par defaut', () => {
    expect(generateStrongPassword().length).toBe(16)
  })

  it('respecte la longueur personnalisee', () => {
    for (const len of [12, 20, 32]) {
      expect(generateStrongPassword(len).length).toBe(len)
    }
  })

  it('contient toujours au moins 2 symboles (seule garantie du generateur)', () => {
    // generatePassword garantit uniquement un minimum de symboles.
    // Les autres categories (upper, lower, numbers) sont tirees aleatoirement
    // dans l'ensemble complet et ne sont pas garanties individuellement.
    for (let i = 0; i < 30; i++) {
      const pwd = generateStrongPassword(32)
      const symbolCount = (pwd.match(/[@\-!&_#]/g) || []).length
      expect(symbolCount).toBeGreaterThanOrEqual(2)
    }
  })

  it('genere un mot de passe fort (strength = 3)', () => {
    const pwd = generateStrongPassword(16)
    expect(getPasswordStrength(pwd)).toBe(3)
  })
})
