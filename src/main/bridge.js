import { WebSocketServer } from 'ws'
import crypto from 'node:crypto'
import * as fs from 'node:fs'
import { generateSync as totpGenerateSync } from 'otplib'
import { getAllAccounts, addAccount } from './accounts.js'
import { isVaultUnlocked } from './auth.js'
import { extractDomain, domainMatches } from './autofill.js'

const HOST = '127.0.0.1'
const DEFAULT_PORT = 17872
const MAX_PORT_TRIES = 10
const PAIRING_TTL_MS = 3 * 60 * 1000
const MAX_PAIR_ATTEMPTS = 5

let wss = null
let prefsPath = null
let onStatus = null
let onSaved = null

let pairings = []
let bridgeLocale = 'fr'
let bridgeAutoSubmit = false
let activePort = null
let pendingPairing = null

const authedSockets = new Set()

function readPrefs() {
  try {
    if (fs.existsSync(prefsPath)) return JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
  } catch (e) {
    console.error('Bridge: lecture preferences echouee', e)
  }
  return {}
}

function writePrefs(patch) {
  const prefs = readPrefs()
  Object.assign(prefs, patch)
  try {
    fs.writeFileSync(prefsPath, JSON.stringify(prefs))
  } catch (e) {
    console.error('Bridge: ecriture preferences echouee', e)
  }
}

function isExtensionOrigin(origin) {
  return (
    typeof origin === 'string' &&
    (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://'))
  )
}

function labelFromExtId(extId) {
  if (typeof extId === 'string' && extId.startsWith('moz-extension://')) return 'Firefox'
  return 'Navigateur'
}

function loadPairing() {
  const prefs = readPrefs()
  if (Array.isArray(prefs.bridgePairings)) {
    pairings = prefs.bridgePairings.filter(
      (p) => p && typeof p.extId === 'string' && typeof p.token === 'string'
    )
    return
  }
  if (typeof prefs.bridgeToken === 'string' && typeof prefs.bridgeExtId === 'string') {
    pairings = [
      {
        extId: prefs.bridgeExtId,
        token: prefs.bridgeToken,
        label: labelFromExtId(prefs.bridgeExtId),
        pairedAt: Date.now()
      }
    ]
    writePrefs({ bridgePairings: pairings, bridgeToken: undefined, bridgeExtId: undefined })
    return
  }
  pairings = []
}

function isPaired() {
  return pairings.length > 0
}

function findByToken(token, origin) {
  if (typeof token !== 'string') return null
  return pairings.find((p) => p.token === token && (!origin || p.extId === origin)) || null
}

function upsertPairing(entry) {
  pairings = pairings.filter((p) => p.extId !== entry.extId)
  pairings.push(entry)
  writePrefs({ bridgePairings: pairings })
}

function emitStatus() {
  if (typeof onStatus === 'function') onStatus(getStatus())
}

function send(ws, payload) {
  try {
    ws.send(JSON.stringify(payload))
  } catch {
    void 0
  }
}

function computeTotp(secret) {
  if (!secret) return null
  try {
    const cleaned = secret.replace(/\s/g, '').toUpperCase()
    return String(totpGenerateSync({ secret: cleaned })).padStart(6, '0')
  } catch {
    return null
  }
}

function pairingActive() {
  return !!pendingPairing && pendingPairing.expiresAt > Date.now()
}

function verifyProof(code, nonce, proof) {
  if (typeof proof !== 'string' || typeof nonce !== 'string') return false
  const expected = crypto.createHmac('sha256', code).update(nonce).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(proof, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function handleQuery(ws, msg) {
  if (!isVaultUnlocked()) return send(ws, { type: 'locked' })
  const domain = extractDomain(msg.url)
  if (!domain) return send(ws, { type: 'matches', reqId: msg.reqId, items: [] })

  let accounts = []
  try {
    accounts = getAllAccounts()
  } catch {
    return send(ws, { type: 'locked' })
  }

  const items = accounts
    .filter((a) => domainMatches(a.url, domain))
    .map((a) => ({
      id: a.id,
      title: a.title,
      login: a.login || '',
      hasTotp: !!a.totp_secret
    }))

  send(ws, { type: 'matches', reqId: msg.reqId, items })
}

function handleFill(ws, msg) {
  if (!isVaultUnlocked()) return send(ws, { type: 'locked' })

  let account = null
  try {
    account = getAllAccounts().find((a) => a.id === msg.id)
  } catch {
    return send(ws, { type: 'locked' })
  }
  if (!account) return send(ws, { type: 'error', reqId: msg.reqId, reason: 'not_found' })

  const fields = Array.isArray(msg.fields) ? msg.fields : ['login', 'password']
  const secret = { type: 'secret', reqId: msg.reqId, autoSubmit: bridgeAutoSubmit }
  if (fields.includes('login')) secret.login = account.login || ''
  if (fields.includes('password')) secret.password = account.password || ''
  if (fields.includes('totp')) secret.totp = computeTotp(account.totp_secret)

  send(ws, secret)
}

function deriveTitle(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const base = host.split('.')[0] || host
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return 'Compte'
  }
}

function handleSave(ws, msg) {
  if (!isVaultUnlocked()) return send(ws, { type: 'locked' })
  const login = typeof msg.login === 'string' ? msg.login : ''
  const password = typeof msg.password === 'string' ? msg.password : ''
  if (!password) return send(ws, { type: 'error', reqId: msg.reqId, reason: 'no_password' })
  const url = typeof msg.url === 'string' ? msg.url : ''
  const title = typeof msg.title === 'string' && msg.title.trim() ? msg.title.trim() : deriveTitle(url)
  try {
    const id = addAccount({ title, url, login, password })
    if (typeof onSaved === 'function') onSaved()
    send(ws, { type: 'saved', reqId: msg.reqId, id })
  } catch (e) {
    console.error('Bridge: enregistrement compte echoue', e)
    send(ws, { type: 'error', reqId: msg.reqId, reason: 'save_failed' })
  }
}

function handlePairProof(ws, state, msg) {
  if (!pairingActive()) return send(ws, { type: 'pairFailed', reason: 'expired' })
  if (!state.nonce) return send(ws, { type: 'pairFailed', reason: 'no_challenge' })
  if (!verifyProof(pendingPairing.code, state.nonce, msg.proof)) {
    pendingPairing.attempts += 1
    if (pendingPairing.attempts >= MAX_PAIR_ATTEMPTS) {
      pendingPairing = null
      emitStatus()
      return send(ws, { type: 'pairFailed', reason: 'too_many' })
    }
    return send(ws, { type: 'pairFailed', reason: 'bad_code' })
  }

  const extId = state.origin || (typeof msg.extId === 'string' ? msg.extId : null)
  if (!extId) return send(ws, { type: 'pairFailed', reason: 'no_origin' })
  if (!isExtensionOrigin(extId)) return send(ws, { type: 'pairFailed', reason: 'bad_origin' })

  const token = crypto.randomBytes(32).toString('hex')
  const label =
    typeof msg.label === 'string' && msg.label.trim() ? msg.label.trim() : labelFromExtId(extId)
  upsertPairing({ extId, token, label, pairedAt: Date.now() })
  pendingPairing = null

  state.authed = true
  state.extId = extId
  ws._rpExtId = extId
  authedSockets.add(ws)
  send(ws, { type: 'paired', token, locale: bridgeLocale, autoSubmit: bridgeAutoSubmit })
  emitStatus()
}

function handleHello(ws, state, msg) {
  if (!isPaired()) {
    send(ws, { type: 'unauthorized' })
    ws.close()
    return
  }
  const entry = findByToken(msg.token, state.origin)
  if (!entry) {
    send(ws, { type: 'unauthorized' })
    ws.close()
    return
  }
  state.authed = true
  state.extId = entry.extId
  ws._rpExtId = entry.extId
  authedSockets.add(ws)
  send(ws, { type: 'ready', locale: bridgeLocale, autoSubmit: bridgeAutoSubmit })
  emitStatus()
}

function handleMessage(ws, state, raw) {
  let msg = null
  try {
    msg = JSON.parse(raw.toString())
  } catch {
    return
  }
  if (!msg || typeof msg.type !== 'string') return

  switch (msg.type) {
    case 'pairHello':
      state.nonce = crypto.randomBytes(16).toString('hex')
      send(ws, { type: 'pairChallenge', nonce: state.nonce })
      return
    case 'pairProof':
      handlePairProof(ws, state, msg)
      return
    case 'hello':
      handleHello(ws, state, msg)
      return
    default:
      break
  }

  if (!state.authed) {
    send(ws, { type: 'unauthorized' })
    ws.close()
    return
  }

  switch (msg.type) {
    case 'query':
      handleQuery(ws, msg)
      break
    case 'fill':
      handleFill(ws, msg)
      break
    case 'save':
      handleSave(ws, msg)
      break
    default:
      break
  }
}

function listen(port, triesLeft) {
  const server = new WebSocketServer({
    host: HOST,
    port,
    verifyClient: (info) => isExtensionOrigin(info.req.headers.origin)
  })

  server.on('connection', (ws, req) => {
    const state = { authed: false, origin: req.headers.origin || null, nonce: null }
    ws.on('message', (raw) => handleMessage(ws, state, raw))
    ws.on('close', () => {
      if (authedSockets.delete(ws)) emitStatus()
    })
    ws.on('error', () => void 0)
  })

  server.on('listening', () => {
    activePort = port
    writePrefs({ bridgePort: port })
    console.log('Bridge: serveur WebSocket en ecoute sur', HOST + ':' + port)
    emitStatus()
  })

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && triesLeft > 0) {
      console.warn('Bridge: port', port, 'occupe, tentative sur', port + 1)
      try {
        server.close()
      } catch {
        void 0
      }
      listen(port + 1, triesLeft - 1)
      return
    }
    console.error('Bridge: erreur serveur', err)
  })

  wss = server
}

export function startBridge(prefsFilePath, statusCallback = null, savedCallback = null) {
  if (wss) return
  prefsPath = prefsFilePath
  onStatus = statusCallback
  onSaved = savedCallback
  loadPairing()
  bridgeAutoSubmit = readPrefs().bridgeAutoSubmit === true
  listen(DEFAULT_PORT, MAX_PORT_TRIES)
}

export function stopBridge() {
  if (!wss) return
  try {
    for (const client of wss.clients) {
      try {
        client.terminate()
      } catch {
        void 0
      }
    }
    wss.close()
  } catch (e) {
    console.error('Bridge: arret serveur echoue', e)
  }
  wss = null
  activePort = null
  authedSockets.clear()
  pendingPairing = null
}

function pushConfig() {
  for (const ws of authedSockets) {
    send(ws, { type: 'config', locale: bridgeLocale, autoSubmit: bridgeAutoSubmit })
  }
}

export function setBridgeLocale(locale) {
  const next = locale === 'en' ? 'en' : 'fr'
  if (next === bridgeLocale) return
  bridgeLocale = next
  pushConfig()
}

export function setBridgeAutoSubmit(value) {
  bridgeAutoSubmit = !!value
  writePrefs({ bridgeAutoSubmit })
  pushConfig()
}

export function generatePairingCode() {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  pendingPairing = { code, expiresAt: Date.now() + PAIRING_TTL_MS, attempts: 0 }
  emitStatus()
  return { code, expiresAt: pendingPairing.expiresAt }
}

export function revokePairing(extId) {
  if (typeof extId === 'string' && extId) {
    pairings = pairings.filter((p) => p.extId !== extId)
    writePrefs({ bridgePairings: pairings })
    for (const ws of [...authedSockets]) {
      if (ws._rpExtId === extId) {
        try {
          ws.terminate()
        } catch {
          void 0
        }
        authedSockets.delete(ws)
      }
    }
    emitStatus()
    return true
  }
  pairings = []
  pendingPairing = null
  writePrefs({ bridgePairings: [] })
  for (const ws of authedSockets) {
    try {
      ws.terminate()
    } catch {
      void 0
    }
  }
  authedSockets.clear()
  emitStatus()
  return true
}

function connectedExtIds() {
  const ids = new Set()
  for (const ws of authedSockets) if (ws._rpExtId) ids.add(ws._rpExtId)
  return ids
}

export function getStatus() {
  const live = connectedExtIds()
  return {
    running: !!wss,
    port: activePort,
    paired: isPaired(),
    locale: bridgeLocale,
    autoSubmit: bridgeAutoSubmit,
    connected: authedSockets.size > 0,
    connectionCount: authedSockets.size,
    pairings: pairings.map((p) => ({
      extId: p.extId,
      label: p.label || labelFromExtId(p.extId),
      pairedAt: p.pairedAt || null,
      connected: live.has(p.extId)
    })),
    pairing: pairingActive(),
    pairingExpiresAt: pairingActive() ? pendingPairing.expiresAt : null
  }
}

export function getBridgeInfo() {
  return { port: activePort, running: !!wss }
}
