const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '@-!&_#'
}

function randomPick(str, count) {
  const values = new Uint32Array(count)
  window.crypto.getRandomValues(values)
  return Array.from(values, (v) => str[v % str.length])
}

function shuffle(arr) {
  const values = new Uint32Array(arr.length)
  window.crypto.getRandomValues(values)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = values[i] % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generatePassword(length = 16, options = {}) {
  const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options

  let allChars = ''
  if (uppercase) allChars += CHARSET.uppercase
  if (lowercase) allChars += CHARSET.lowercase
  if (numbers) allChars += CHARSET.numbers
  if (symbols) allChars += CHARSET.symbols

  if (!allChars) return ''

  const chars = []

  if (symbols) {
    const minSymbols = Math.min(Math.max(2, Math.floor(length / 5)), length)
    chars.push(...randomPick(CHARSET.symbols, minSymbols))
  }

  const remaining = length - chars.length
  if (remaining > 0) chars.push(...randomPick(allChars, remaining))

  return shuffle(chars).join('')
}

export function generateStrongPassword(length = 16) {
  return generatePassword(length, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
}

export function getPasswordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return 1
  if (score <= 4) return 2
  return 3
}
