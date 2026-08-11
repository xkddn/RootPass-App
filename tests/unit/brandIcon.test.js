/**
 * Tests unitaires - src/renderer/src/utils/brandIcon.js
 *
 * Recherche d'icones de marques, detection couleur sombre, conversions couleur.
 */
import { describe, it, expect } from 'vitest'
import {
  getBrandIcon,
  isDarkHex,
  hexToRgba,
  hueFromString
} from '../../src/renderer/src/utils/brandIcon.js'

// ─── getBrandIcon ─────────────────────────────────────────────────────────

describe('getBrandIcon', () => {
  it('retourne null pour un titre vide ou falsy', () => {
    expect(getBrandIcon('')).toBeNull()
    expect(getBrandIcon(null)).toBeNull()
    expect(getBrandIcon(undefined)).toBeNull()
  })

  it('trouve GitHub par son titre exact', () => {
    const icon = getBrandIcon('GitHub')
    expect(icon).not.toBeNull()
    expect(icon.slug).toBe('github')
  })

  it('est insensible a la casse', () => {
    const a = getBrandIcon('github')
    const b = getBrandIcon('GITHUB')
    const c = getBrandIcon('GitHub')
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(c).not.toBeNull()
  })

  it('trouve les marques avec override (LinkedIn, Google, Apple, etc.)', () => {
    const overrides = [
      'LinkedIn',
      'Google',
      'Apple',
      'Facebook',
      'Instagram',
      'Twitter',
      'Microsoft'
    ]
    for (const brand of overrides) {
      const icon = getBrandIcon(brand)
      expect(icon).not.toBeNull()
    }
  })

  it("l'icone retournee contient path, hex et slug", () => {
    const icon = getBrandIcon('GitHub')
    expect(typeof icon.path).toBe('string')
    expect(typeof icon.hex).toBe('string')
    expect(icon.hex).toMatch(/^[0-9A-Fa-f]{6}$/)
  })

  it('retourne null pour une marque inexistante', () => {
    expect(getBrandIcon('MarkeSuperInconnue99999')).toBeNull()
  })

  it('normalise les accents via NFD : GitHub avec u-umlaut trouve quand meme GitHub', () => {
    // NFD decompose 'ü' -> 'u' + combining diaeresis -> combining char supprime -> 'u'
    // Donc 'GitHüb' -> normalize -> 'github' -> trouve l'icone GitHub
    const icon = getBrandIcon('GitHüb')
    expect(icon).not.toBeNull()
    expect(icon.slug).toBe('github')
  })

  it('retourne null pour une marque vraiment inconnue (pas de correspondance meme apres normalisation)', () => {
    expect(getBrandIcon('zzz-marque-inconnue-999')).toBeNull()
  })

  it('trouve des icones simpleicons populaires', () => {
    const brands = ['npm', 'docker', 'react', 'vue', 'figma']
    let found = 0
    for (const brand of brands) {
      if (getBrandIcon(brand)) found++
    }
    expect(found).toBeGreaterThan(0)
  })
})

// ─── isDarkHex ────────────────────────────────────────────────────────────

describe('isDarkHex', () => {
  it('retourne true pour le noir (000000)', () => {
    expect(isDarkHex('000000')).toBe(true)
  })

  it('retourne false pour le blanc (ffffff)', () => {
    expect(isDarkHex('ffffff')).toBe(false)
  })

  it('retourne true pour du bleu tres sombre', () => {
    expect(isDarkHex('000033')).toBe(true)
  })

  it('retourne false pour du jaune vif (luminance elevee)', () => {
    expect(isDarkHex('ffff00')).toBe(false)
  })

  it('retourne true pour la couleur GitHub (#181717)', () => {
    // GitHub est presque noir -> sombre
    expect(isDarkHex('181717')).toBe(true)
  })

  it('retourne false pour le bleu LinkedIn (#0A66C2)', () => {
    // LinkedIn blue -> luminance assez elevee -> pas sombre
    expect(isDarkHex('0A66C2')).toBe(false)
  })

  it('utilise la formule de luminance WCAG (seuil = 60)', () => {
    // Blanc pur : 0.2126*255 + 0.7152*255 + 0.0722*255 = 255 > 60 -> false
    expect(isDarkHex('ffffff')).toBe(false)
    // Noir pur : 0 < 60 -> true
    expect(isDarkHex('000000')).toBe(true)
  })
})

// ─── hexToRgba ────────────────────────────────────────────────────────────

describe('hexToRgba', () => {
  it('convertit un hex en rgba avec alpha', () => {
    expect(hexToRgba('ff0000', 1)).toBe('rgba(255, 0, 0, 1)')
    expect(hexToRgba('0000ff', 0.5)).toBe('rgba(0, 0, 255, 0.5)')
    expect(hexToRgba('000000', 0)).toBe('rgba(0, 0, 0, 0)')
  })

  it('retourne une chaine au format rgba(...)', () => {
    const result = hexToRgba('181717', 0.8)
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/)
  })

  it('parse correctement les composantes RGB', () => {
    // #4285F4 -> r=66, g=133, b=244
    const result = hexToRgba('4285F4', 1)
    expect(result).toBe('rgba(66, 133, 244, 1)')
  })
})

// ─── hueFromString ────────────────────────────────────────────────────────

describe('hueFromString', () => {
  it('retourne 0 pour une chaine vide', () => {
    expect(hueFromString('')).toBe(0)
    expect(hueFromString(null)).toBe(0)
    expect(hueFromString(undefined)).toBe(0)
  })

  it('retourne un entier entre 0 et 359', () => {
    const strings = ['GitHub', 'Google', 'Netflix', 'Spotify', 'a', 'XYZ123']
    for (const s of strings) {
      const hue = hueFromString(s)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
      expect(Number.isInteger(hue)).toBe(true)
    }
  })

  it('est deterministe — meme entree = meme sortie', () => {
    expect(hueFromString('GitHub')).toBe(hueFromString('GitHub'))
    expect(hueFromString('Netflix')).toBe(hueFromString('Netflix'))
  })

  it('produit des valeurs differentes pour des chaines differentes', () => {
    const results = new Set(
      ['GitHub', 'Google', 'Netflix', 'Spotify', 'Amazon', 'Discord'].map(hueFromString)
    )
    expect(results.size).toBeGreaterThan(1)
  })
})
