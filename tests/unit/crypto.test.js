import { describe, it, expect } from 'vitest'
import {
  generateSalt,
  deriveKey,
  encrypt,
  decrypt,
  getDefaultIterations
} from '../../src/main/crypto.js'

// Cle de test reutilisable (PBKDF2 a faible nombre d'iterations pour la vitesse)
const TEST_SALT = 'aabbccddeeff00112233445566778899'
const testKey = () => deriveKey('test-password', TEST_SALT, 1000)

// ─── generateSalt ──────────────────────────────────────────────────────────

describe('generateSalt', () => {
  it('retourne une chaine hex de 32 caracteres (16 octets)', () => {
    const salt = generateSalt()
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
  })

  it('genere des valeurs uniques a chaque appel', () => {
    const salts = new Set(Array.from({ length: 20 }, () => generateSalt()))
    expect(salts.size).toBe(20)
  })
})

// ─── deriveKey ────────────────────────────────────────────────────────────

describe('deriveKey', () => {
  it('est deterministe : meme entree produit toujours la meme cle', () => {
    const k1 = deriveKey('monPassword', TEST_SALT, 1000)
    const k2 = deriveKey('monPassword', TEST_SALT, 1000)
    expect(k1).toEqual(k2)
  })

  it('retourne un Buffer de 32 octets', () => {
    const key = deriveKey('pass', TEST_SALT, 1000)
    expect(key).toBeInstanceOf(Buffer)
    expect(key.length).toBe(32)
  })

  it('produit des cles differentes pour des mots de passe differents', () => {
    const k1 = deriveKey('password-A', TEST_SALT, 1000)
    const k2 = deriveKey('password-B', TEST_SALT, 1000)
    expect(k1).not.toEqual(k2)
  })

  it('produit des cles differentes pour des sels differents', () => {
    const k1 = deriveKey('same-pass', generateSalt(), 1000)
    const k2 = deriveKey('same-pass', generateSalt(), 1000)
    expect(k1).not.toEqual(k2)
  })

  it("produit des cles differentes selon le nombre d'iterations", () => {
    const k1 = deriveKey('pass', TEST_SALT, 1000)
    const k2 = deriveKey('pass', TEST_SALT, 2000)
    expect(k1).not.toEqual(k2)
  })
})

// ─── encrypt ──────────────────────────────────────────────────────────────

describe('encrypt', () => {
  it('retourne une chaine au format iv:authTag:ciphertext (3 segments hex)', () => {
    const key = testKey()
    const result = encrypt('hello', key)
    const parts = result.split(':')
    expect(parts).toHaveLength(3)
    parts.forEach((p) => expect(p).toMatch(/^[0-9a-f]+$/))
  })

  it('IV fait 12 octets (24 hex chars)', () => {
    const key = testKey()
    const [iv] = encrypt('hello', key).split(':')
    expect(iv.length).toBe(24)
  })

  it('authTag fait 16 octets (32 hex chars)', () => {
    const key = testKey()
    const [, tag] = encrypt('hello', key).split(':')
    expect(tag.length).toBe(32)
  })

  it('genere des ciphertexts differents a chaque appel (IV aleatoire)', () => {
    const key = testKey()
    const c1 = encrypt('same-text', key)
    const c2 = encrypt('same-text', key)
    expect(c1).not.toBe(c2)
  })
})

// ─── decrypt ──────────────────────────────────────────────────────────────

describe('decrypt', () => {
  it('round-trip : decrypt(encrypt(text)) === text pour divers contenus', () => {
    const key = testKey()
    const payloads = [
      'hello',
      '',
      'mot de passe avec emoji',
      '{"key":"value","nested":{"a":1}}',
      'a'.repeat(5000)
    ]
    for (const text of payloads) {
      expect(decrypt(encrypt(text, key), key)).toBe(text)
    }
  })

  it('leve une erreur sur format invalide (moins de 3 segments)', () => {
    const key = testKey()
    expect(() => decrypt('invalide', key)).toThrow()
    expect(() => decrypt('a:b', key)).toThrow()
  })

  it('leve une erreur avec une mauvaise cle (GCM authTag invalide)', () => {
    const key = testKey()
    const wrongKey = deriveKey('mauvaise-cle', generateSalt(), 1000)
    const encrypted = encrypt('secret', key)
    expect(() => decrypt(encrypted, wrongKey)).toThrow()
  })

  it('leve une erreur si le ciphertext est altere', () => {
    const key = testKey()
    const encrypted = encrypt('secret', key)
    const parts = encrypted.split(':')
    parts[2] = parts[2].slice(0, -4) + 'dead'
    expect(() => decrypt(parts.join(':'), key)).toThrow()
  })

  it("leve une erreur si l'authTag est altere", () => {
    const key = testKey()
    const encrypted = encrypt('secret', key)
    const parts = encrypted.split(':')
    parts[1] = parts[1].slice(0, -4) + 'dead'
    expect(() => decrypt(parts.join(':'), key)).toThrow()
  })
})

// ─── getDefaultIterations ──────────────────────────────────────────────────

describe('getDefaultIterations', () => {
  it('retourne 600 000 (valeur de securite OWASP)', () => {
    expect(getDefaultIterations()).toBe(600000)
  })
})
