import { webcrypto } from 'crypto'

// passwordGenerator.js utilise window.crypto.getRandomValues (API navigateur).
// En environnement Node.js, on expose l'API Web Crypto via globalThis.window.
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {}
}
if (!globalThis.window.crypto) {
  globalThis.window.crypto = webcrypto
}
