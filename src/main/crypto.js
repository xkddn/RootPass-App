import crypto from 'node:crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 600000
const DIGEST = 'sha256'
const ALGORITHM = 'aes-256-gcm'

export function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH).toString('hex')
}

export function deriveKey(password, saltHex, iterations = 100000) {
  const salt = Buffer.from(saltHex, 'hex')
  return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
}

export function getDefaultIterations() {
  return ITERATIONS
}

export function encrypt(text, key) {
  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData, key) {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Format de données chiffrées invalide')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encryptedText = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
