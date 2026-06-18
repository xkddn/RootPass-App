const api = globalThis.browser || globalThis.chrome
const BASE_PORT = 17872
const PORT_TRIES = 10
const RECONNECT_MIN = 1000
const RECONNECT_MAX = 15000

let ws = null
let wsState = 'disconnected'
let appState = 'unknown'
let token = null
let pendingCode = null
let reconnectDelay = RECONNECT_MIN
let reconnectTimer = null
let discoveryIndex = 0
let foundPort = null
let failuresSinceFound = 0

let reqCounter = 0
const pending = new Map()
const pairWaiters = []

function nextReqId() {
  reqCounter += 1
  return reqCounter
}

function detectBrowser() {
  const ua = (globalThis.navigator && navigator.userAgent) || ''
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera'
  if (ua.includes('Chrome')) return 'Chrome'
  return 'Navigateur'
}

async function loadToken() {
  const data = await api.storage.local.get('token')
  token = typeof data.token === 'string' ? data.token : null
}

async function applyAppLocale(locale) {
  if (locale !== 'fr' && locale !== 'en') return
  await api.storage.local.set({ appLocale: locale })
  api.runtime.sendMessage({ type: 'locale', locale }).catch(() => {})
  try {
    const tabs = await api.tabs.query({})
    for (const tab of tabs) {
      if (tab.id != null) api.tabs.sendMessage(tab.id, { type: 'locale', locale }).catch(() => {})
    }
  } catch {
    void 0
  }
}

async function applyAutoSubmit(value) {
  const flag = !!value
  await api.storage.local.set({ appAutoSubmit: flag })
  try {
    const tabs = await api.tabs.query({})
    for (const tab of tabs) {
      if (tab.id != null) {
        api.tabs.sendMessage(tab.id, { type: 'autosubmit', value: flag }).catch(() => {})
      }
    }
  } catch {
    void 0
  }
}

function applyConfig(msg) {
  if (msg.locale) applyAppLocale(msg.locale)
  if (typeof msg.autoSubmit !== 'undefined') applyAutoSubmit(msg.autoSubmit)
}

function setState(next) {
  appState = next
  broadcastState()
}

function broadcastState() {
  api.runtime.sendMessage({ type: 'state', wsState, appState }).catch(() => {})
}

function hexFromBuffer(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacHex(key, message) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return hexFromBuffer(sig)
}

function send(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
    return true
  }
  return false
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  clearTimeout(reconnectTimer)
  wsState = 'connecting'
  const port = foundPort != null ? foundPort : BASE_PORT + (discoveryIndex % PORT_TRIES)
  let socket
  let opened = false
  try {
    socket = new WebSocket('ws://127.0.0.1:' + port)
  } catch {
    scheduleReconnect(false)
    return
  }
  ws = socket

  socket.onopen = () => {
    opened = true
    foundPort = port
    failuresSinceFound = 0
    wsState = 'open'
    reconnectDelay = RECONNECT_MIN
    if (token) {
      send({ type: 'hello', token })
    } else {
      setState('unpaired')
    }
    broadcastState()
  }

  socket.onmessage = (event) => {
    let msg = null
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    handleMessage(msg)
  }

  socket.onclose = () => {
    if (ws === socket) ws = null
    wsState = 'disconnected'
    rejectAllPending('disconnected')
    broadcastState()
    scheduleReconnect(opened)
  }

  socket.onerror = () => {
    try {
      socket.close()
    } catch {
      void 0
    }
  }
}

function scheduleReconnect(wasOpen) {
  if (foundPort != null && !wasOpen) {
    failuresSinceFound += 1
    if (failuresSinceFound >= 3) {
      foundPort = null
      failuresSinceFound = 0
    }
  }
  if (foundPort == null && !wasOpen) discoveryIndex += 1

  const scanning = foundPort == null
  let delay
  if (scanning) {
    const completedSweep = discoveryIndex > 0 && discoveryIndex % PORT_TRIES === 0
    delay = completedSweep ? 5000 : 250
  } else {
    delay = reconnectDelay
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX)
  }
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(connect, delay)
}

function rejectAllPending(reason) {
  for (const [, entry] of pending) entry.resolve({ error: reason })
  pending.clear()
  while (pairWaiters.length) pairWaiters.shift()({ ok: false, reason })
}

async function handleMessage(msg) {
  switch (msg.type) {
    case 'ready':
      applyConfig(msg)
      setState('ready')
      return
    case 'config':
      applyConfig(msg)
      return
    case 'locked':
      setState('locked')
      resolveReq(msg.reqId, { error: 'locked' })
      return
    case 'unauthorized':
      token = null
      await api.storage.local.remove('token')
      setState('unpaired')
      return
    case 'pairChallenge':
      if (pendingCode) {
        const proof = await hmacHex(pendingCode, msg.nonce)
        send({ type: 'pairProof', proof, label: detectBrowser() })
      }
      return
    case 'paired':
      token = msg.token
      pendingCode = null
      await api.storage.local.set({ token })
      applyConfig(msg)
      setState('ready')
      while (pairWaiters.length) pairWaiters.shift()({ ok: true })
      return
    case 'pairFailed':
      pendingCode = null
      while (pairWaiters.length) pairWaiters.shift()({ ok: false, reason: msg.reason })
      return
    case 'matches':
      resolveReq(msg.reqId, { items: msg.items || [] })
      return
    case 'secret':
      resolveReq(msg.reqId, {
        secret: {
          login: msg.login,
          password: msg.password,
          totp: msg.totp,
          autoSubmit: !!msg.autoSubmit
        }
      })
      return
    case 'saved':
      resolveReq(msg.reqId, { id: msg.id })
      return
    case 'error':
      resolveReq(msg.reqId, { error: msg.reason || 'error' })
      return
    default:
      return
  }
}

function resolveReq(reqId, value) {
  const entry = pending.get(reqId)
  if (!entry) return
  clearTimeout(entry.timer)
  pending.delete(reqId)
  entry.resolve(value)
}

function request(payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!send(payload)) {
      resolve({ error: 'disconnected' })
      return
    }
    const timer = setTimeout(() => {
      pending.delete(payload.reqId)
      resolve({ error: 'timeout' })
    }, timeoutMs)
    pending.set(payload.reqId, { resolve, timer })
  })
}

async function ensureConnected(timeoutMs = 4000) {
  if (ws && ws.readyState === WebSocket.OPEN) return true
  connect()
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (ws && ws.readyState === WebSocket.OPEN) return true
    await new Promise((r) => setTimeout(r, 150))
  }
  return false
}

async function doPair(code) {
  pendingCode = code
  const ok = await ensureConnected()
  if (!ok) return { ok: false, reason: 'disconnected' }
  return new Promise((resolve) => {
    pairWaiters.push(resolve)
    send({ type: 'pairHello' })
    setTimeout(() => {
      const idx = pairWaiters.indexOf(resolve)
      if (idx !== -1) {
        pairWaiters.splice(idx, 1)
        resolve({ ok: false, reason: 'timeout' })
      }
    }, 10000)
  })
}

async function doQuery(url) {
  if (!(await ensureConnected())) return { items: [], error: 'disconnected' }
  if (token && appState !== 'ready') send({ type: 'hello', token })
  return request({ type: 'query', reqId: nextReqId(), url })
}

async function doFill(id, fields) {
  if (!(await ensureConnected())) return { error: 'disconnected' }
  return request({ type: 'fill', reqId: nextReqId(), id, fields })
}

async function revokeLocal() {
  token = null
  pendingCode = null
  await api.storage.local.remove('token')
  setState('unpaired')
  return { ok: true }
}

const pendingSaves = new Map()

function saveDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

async function isExcluded(domain) {
  try {
    const d = await api.storage.local.get('saveExclusions')
    return Array.isArray(d.saveExclusions) && d.saveExclusions.includes(domain)
  } catch {
    return false
  }
}

async function handleMaybeSave(tabId, msg) {
  if (tabId == null) return
  const domain = saveDomain(msg.url)
  if (!domain) return
  if (await isExcluded(domain)) return
  const login = typeof msg.login === 'string' ? msg.login : ''
  const password = typeof msg.password === 'string' ? msg.password : ''
  if (!password) return
  const res = await doQuery(msg.url)
  if (!res || res.error || !Array.isArray(res.items)) return
  const exists = login && res.items.some((it) => (it.login || '').toLowerCase() === login.toLowerCase())
  if (exists) return
  pendingSaves.set(tabId, { url: msg.url, login, password, title: domain, domain })
  api.tabs.sendMessage(tabId, { cmd: 'offerSave', login, domain }).catch(() => {})
}

async function handleConfirmSave(tabId) {
  const entry = pendingSaves.get(tabId)
  if (!entry) return { ok: false }
  if (!(await ensureConnected())) return { ok: false, reason: 'disconnected' }
  const res = await request({
    type: 'save',
    reqId: nextReqId(),
    url: entry.url,
    login: entry.login,
    password: entry.password,
    title: entry.title
  })
  if (res && res.id) {
    pendingSaves.delete(tabId)
    api.tabs.sendMessage(tabId, { cmd: 'saveDone' }).catch(() => {})
    return { ok: true }
  }
  return { ok: false, reason: (res && res.error) || 'failed' }
}

async function handleNeverSave(tabId, domain) {
  try {
    const d = await api.storage.local.get('saveExclusions')
    const list = Array.isArray(d.saveExclusions) ? d.saveExclusions : []
    if (domain && !list.includes(domain)) list.push(domain)
    await api.storage.local.set({ saveExclusions: list })
  } catch {
    void 0
  }
  pendingSaves.delete(tabId)
}

api.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && pendingSaves.has(tabId)) {
    const entry = pendingSaves.get(tabId)
    api.tabs.sendMessage(tabId, { cmd: 'offerSave', login: entry.login, domain: entry.domain }).catch(() => {})
  }
})

api.tabs.onRemoved.addListener((tabId) => pendingSaves.delete(tabId))

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    switch (msg && msg.cmd) {
      case 'getState':
        await ensureConnected(2000)
        sendResponse({ wsState, appState })
        return
      case 'pair':
        sendResponse(await doPair(String(msg.code || '')))
        return
      case 'query':
        sendResponse(await doQuery(msg.url))
        return
      case 'fill':
        sendResponse(await doFill(msg.id, msg.fields || ['login', 'password', 'totp']))
        return
      case 'fillActive': {
        const result = await doFill(msg.id, ['login', 'password', 'totp'])
        if (result.secret && sender.tab && sender.tab.id != null) {
          api.tabs.sendMessage(sender.tab.id, { cmd: 'doFill', secret: result.secret })
        } else if (result.secret) {
          const [tab] = await api.tabs.query({ active: true, currentWindow: true })
          if (tab) api.tabs.sendMessage(tab.id, { cmd: 'doFill', secret: result.secret })
        }
        sendResponse(result)
        return
      }
      case 'getLocale': {
        const data = await api.storage.local.get('appLocale')
        sendResponse({ locale: data.appLocale || null })
        return
      }
      case 'maybeSave':
        await handleMaybeSave(sender.tab && sender.tab.id, msg)
        sendResponse({ ok: true })
        return
      case 'confirmSave':
        sendResponse(await handleConfirmSave(sender.tab && sender.tab.id))
        return
      case 'dismissSave':
        pendingSaves.delete(sender.tab && sender.tab.id)
        sendResponse({ ok: true })
        return
      case 'neverSave':
        await handleNeverSave(sender.tab && sender.tab.id, msg.domain)
        sendResponse({ ok: true })
        return
      case 'revokeLocal':
        sendResponse(await revokeLocal())
        return
      default:
        sendResponse({ error: 'unknown_cmd' })
    }
  })()
  return true
})

loadToken().then(connect)
