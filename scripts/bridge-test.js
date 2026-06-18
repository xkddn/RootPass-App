import WebSocket from 'ws'
import crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

const ORIGIN = 'chrome-extension://rootpass-dev-test'

const prefsPath =
  process.env.ROOTPASS_PREFS ||
  path.join(os.homedir(), 'AppData', 'Roaming', 'rootpass', 'preferences.json')

function readPrefs() {
  return JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
}

function connect() {
  const port = readPrefs().bridgePort || 17872
  return new WebSocket('ws://127.0.0.1:' + port, { origin: ORIGIN })
}

const args = process.argv.slice(2)
const pairIdx = args.indexOf('--pair')

if (pairIdx !== -1) {
  const code = args[pairIdx + 1]
  if (!code) {
    console.error('Usage: node scripts/bridge-test.js --pair <code 6 chiffres>')
    process.exit(1)
  }
  console.log('Appairage avec le code', code, '(origin', ORIGIN + ')')
  const ws = connect()
  ws.on('open', () => ws.send(JSON.stringify({ type: 'pairHello' })))
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    console.log('<-', JSON.stringify(msg))
    if (msg.type === 'pairChallenge') {
      const proof = crypto.createHmac('sha256', code).update(msg.nonce).digest('hex')
      ws.send(JSON.stringify({ type: 'pairProof', proof }))
    } else if (msg.type === 'paired') {
      console.log('OK: appaire. Token persiste cote app.')
      ws.close()
    } else if (msg.type === 'pairFailed') {
      console.error('ECHEC appairage:', msg.reason)
      ws.close()
    }
  })
  ws.on('error', (e) => console.error('Erreur WS:', e.message))
} else {
  const domain = args[0] || 'github.com'
  const useBadToken = args.includes('--bad-token')
  const prefs = readPrefs()
  const token = useBadToken ? 'mauvais-token' : prefs.bridgeToken

  if (!token) {
    console.error('Aucun token. Lance d abord: node scripts/bridge-test.js --pair <code>')
    process.exit(1)
  }

  console.log('Domaine :', domain, '| token', useBadToken ? '(faux)' : token.slice(0, 12) + '...')
  console.log('---')
  const ws = connect()
  ws.on('open', () => ws.send(JSON.stringify({ type: 'hello', token })))
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    console.log('<-', JSON.stringify(msg))

    if (msg.type === 'unauthorized') {
      console.log('REFUS (token faux ou non appaire). OK si attendu.')
      ws.close()
    } else if (msg.type === 'locked') {
      console.log('VAULT VERROUILLE. Deverrouille puis relance.')
      ws.close()
    } else if (msg.type === 'ready') {
      ws.send(JSON.stringify({ type: 'query', reqId: 1, url: 'https://' + domain }))
    } else if (msg.type === 'matches') {
      if (msg.items.some((i) => 'password' in i)) {
        console.error('ECHEC SECU: password dans matches !')
        process.exit(1)
      }
      console.log('OK: aucun password dans matches (' + msg.items.length + ' compte(s))')
      if (!msg.items.length) {
        ws.close()
        return
      }
      ws.send(
        JSON.stringify({
          type: 'fill',
          reqId: 2,
          id: msg.items[0].id,
          fields: ['login', 'password', 'totp']
        })
      )
    } else if (msg.type === 'secret') {
      console.log('OK: secret recu. password present =', typeof msg.password === 'string')
      console.log('   login =', JSON.stringify(msg.login), '| totp =', msg.totp)
      ws.close()
    }
  })
  ws.on('error', (e) => console.error('Erreur WS:', e.message))
  ws.on('close', () => console.log('--- connexion fermee'))
}
