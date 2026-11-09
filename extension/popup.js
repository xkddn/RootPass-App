const api = globalThis.browser || globalThis.chrome
const statusEl = document.getElementById('status')
const bodyEl = document.getElementById('body')
const revokeEl = document.getElementById('revoke')

const ICONS = {
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
}

function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

function setStatus(label, tone) {
  statusEl.hidden = false
  statusEl.textContent = label
  statusEl.className = 'status' + (tone ? ' ' + tone : '')
}

async function activeTab() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

function domainLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function initialOf(text) {
  return (text || '?').trim().charAt(0) || '?'
}

function stateView(iconName, title, text, tone, compact) {
  return `<div class="state${compact ? ' compact' : ''}"><div class="state-ico ${tone || ''}">${svg(iconName)}</div><h2>${title}</h2><p>${text}</p></div>`
}

function renderLoading() {
  bodyEl.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>'
}

function renderPairing(error) {
  setStatus(t('statusNotConnected'))
  revokeEl.hidden = true
  bodyEl.innerHTML = `
    <div class="card pair">
      <h2>${t('pairTitle')}</h2>
      <ol class="steps">
        <li>${t('pairStep1')}</li>
        <li>${t('pairStep2')}</li>
        <li>${t('pairStep3')}</li>
      </ol>
      <input id="code" class="code-input" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="······" aria-label="Code" />
      <button id="pair" class="btn" type="button">${t('pairButton')}</button>
      ${error ? `<div class="err">${error}</div>` : ''}
    </div>
  `
  const codeEl = document.getElementById('code')
  const pairBtn = document.getElementById('pair')
  pairBtn.disabled = true
  codeEl.focus()
  codeEl.addEventListener('input', () => {
    codeEl.value = codeEl.value.replace(/\D/g, '').slice(0, 6)
    pairBtn.disabled = codeEl.value.length !== 6
  })
  codeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !pairBtn.disabled) pairBtn.click()
  })
  pairBtn.addEventListener('click', async () => {
    pairBtn.disabled = true
    pairBtn.textContent = t('pairing')
    const res = await api.runtime.sendMessage({ cmd: 'pair', code: codeEl.value })
    if (res && res.ok) {
      render()
      return
    }
    const reason =
      res && res.reason === 'bad_code'
        ? t('errBadCode')
        : res && (res.reason === 'expired' || res.reason === 'too_many')
          ? t('errExpired')
          : t('errPairFailed')
    renderPairing(reason)
  })
}

function renderLocked() {
  setStatus(t('statusLocked'), 'warn')
  revokeEl.hidden = false
  bodyEl.innerHTML = `<div class="card">${stateView('lock', t('lockedTitle'), t('lockedBody'), 'warn')}</div>`
}

function renderOffline() {
  setStatus(t('statusOffline'))
  revokeEl.hidden = false
  bodyEl.innerHTML = `<div class="card">${stateView('plug', t('offlineTitle'), t('appNotFound'))}</div>`
}

function siteCard(domain, count) {
  const sub = count === 1 ? t('accountsCount1') : t('accountsCountN').replace('{n}', String(count))
  return `
    <div class="site">
      <span class="tile feature">${escapeHtml(initialOf(domain))}</span>
      <span class="meta"><div class="t1">${escapeHtml(domain)}</div><div class="t2">${sub}</div></span>
    </div>
  `
}

async function pausedBanner(url) {
  let state = null
  try {
    state = await api.runtime.sendMessage({ cmd: 'siteSaveState', url })
  } catch {
    state = null
  }
  if (!state || !state.excluded) return null
  const node = document.createElement('div')
  node.className = 'paused'
  node.innerHTML = `<span>${t('savePaused')}</span><button type="button">${t('resume')}</button>`
  node.querySelector('button').addEventListener('click', async () => {
    await api.runtime.sendMessage({ cmd: 'allowSave', url })
    node.remove()
  })
  return node
}

async function copySecret(item, field, btn) {
  let value = item.login || ''
  if (field === 'password') {
    const res = await api.runtime.sendMessage({ cmd: 'fill', id: item.id, fields: ['password'] })
    value = res && res.secret ? res.secret.password || '' : ''
  }
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    return
  }
  const original = btn.innerHTML
  btn.classList.add('done')
  btn.innerHTML = svg('check')
  btn.title = t('copied')
  setTimeout(() => {
    btn.classList.remove('done')
    btn.innerHTML = original
    btn.title = field === 'password' ? t('copyPassword') : t('copyLogin')
  }, 1400)
}

function accountRow(item) {
  const row = document.createElement('div')
  row.className = 'item'
  row.tabIndex = 0
  row.setAttribute('role', 'button')
  row.title = t('fill')
  row.innerHTML = `
    <span class="tile"></span>
    <span class="meta"><div class="t1row"><span class="t1"></span>${item.hasTotp ? '<span class="badge">2FA</span>' : ''}</div><div class="t2"></div></span>
    <span class="acts">
      ${item.login ? `<button class="act" type="button" data-copy="login" title="${t('copyLogin')}">${svg('user')}</button>` : ''}
      <button class="act" type="button" data-copy="password" title="${t('copyPassword')}">${svg('key')}</button>
    </span>
  `
  row.querySelector('.tile').textContent = initialOf(item.title)
  row.querySelector('.t1').textContent = item.title || ''
  row.querySelector('.t2').textContent = item.login || t('noLogin')
  const fill = async () => {
    await api.runtime.sendMessage({ cmd: 'fillActive', id: item.id })
    window.close()
  }
  row.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]')
    if (btn) {
      e.stopPropagation()
      copySecret(item, btn.dataset.copy, btn)
      return
    }
    fill()
  })
  row.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === row) {
      e.preventDefault()
      fill()
    }
  })
  return row
}

async function renderAccounts() {
  setStatus(t('statusConnected'), 'ok')
  revokeEl.hidden = false
  const tab = await activeTab()
  const url = tab ? tab.url : ''
  if (!url || !/^https?:/.test(url)) {
    bodyEl.innerHTML = `<div class="card">${stateView('globe', t('openSiteTitle'), t('openSite'))}</div>`
    return
  }
  renderLoading()
  const res = await api.runtime.sendMessage({ cmd: 'query', url })
  if (res && res.error === 'locked') return renderLocked()
  if (!res || res.error) return renderOffline()

  const domain = domainLabel(url)
  const items = Array.isArray(res.items) ? res.items : []
  const card = document.createElement('div')
  card.className = 'card'
  card.innerHTML = siteCard(domain, items.length)
  const banner = await pausedBanner(url)
  if (banner) card.appendChild(banner)

  bodyEl.innerHTML = ''
  bodyEl.appendChild(card)

  if (!items.length) {
    const empty = document.createElement('div')
    empty.className = 'card'
    empty.style.marginTop = '8px'
    empty.innerHTML = stateView('search', t('noAccountsTitle'), t('noAccountsBody'), '', true)
    bodyEl.appendChild(empty)
    return
  }

  const list = document.createElement('div')
  list.className = 'card list'
  for (const item of items) list.appendChild(accountRow(item))
  bodyEl.appendChild(list)
}

async function render() {
  let state = null
  try {
    state = await api.runtime.sendMessage({ cmd: 'getState' })
  } catch {
    state = null
  }
  if (!state || state.wsState !== 'open') return renderOffline()
  if (state.appState === 'ready') return renderAccounts()
  if (state.appState === 'locked') return renderLocked()
  renderPairing()
}

const prefsEl = document.getElementById('prefs')
const PRIVACY_PERMISSION = { permissions: ['privacy'] }

function browserPmNote(state, denied) {
  if (denied) return { text: t('browserPmDenied'), tone: 'bad' }
  if (state.control === 'not_controllable') return { text: t('browserPmPolicy'), tone: 'warn' }
  if (state.control === 'controlled_by_other_extensions') {
    return { text: t('browserPmOther'), tone: 'warn' }
  }
  if (state.disabled) return { text: t('browserPmOn'), tone: '' }
  return null
}

function renderPrefs(state, denied) {
  if (!state || !state.supported) {
    prefsEl.hidden = true
    return
  }
  const locked =
    state.control === 'not_controllable' || state.control === 'controlled_by_other_extensions'
  const note = browserPmNote(state, denied)
  prefsEl.hidden = false
  prefsEl.innerHTML = `
    <div class="card pref">
      <label class="pref-row">
        <span class="meta">
          <div class="pref-title">${t('browserPmTitle')}</div>
          <div class="pref-desc">${t('browserPmDesc')}</div>
        </span>
        <span class="switch">
          <input id="browser-pm" type="checkbox" role="switch" ${state.disabled ? 'checked' : ''} ${locked ? 'disabled' : ''} />
          <span class="track" aria-hidden="true"></span>
        </span>
      </label>
      ${note ? `<p class="pref-note ${note.tone}">${note.text}</p>` : ''}
    </div>
  `
  const input = document.getElementById('browser-pm')
  input.addEventListener('change', () => toggleBrowserPm(input))
}

async function toggleBrowserPm(input) {
  const disable = input.checked
  input.disabled = true
  if (disable) {
    api.storage.local.set({ disableBrowserPm: true })
    let granted = false
    try {
      granted = await api.permissions.request(PRIVACY_PERMISSION)
    } catch {
      granted = false
    }
    if (!granted) {
      await api.storage.local.set({ disableBrowserPm: false })
      renderPrefs(await api.runtime.sendMessage({ cmd: 'getBrowserPm' }), true)
      return
    }
  }
  renderPrefs(await api.runtime.sendMessage({ cmd: 'setBrowserPm', disable }))
}

async function loadPrefs() {
  try {
    renderPrefs(await api.runtime.sendMessage({ cmd: 'getBrowserPm' }))
  } catch {
    prefsEl.hidden = true
  }
}

revokeEl.addEventListener('click', async () => {
  await api.runtime.sendMessage({ cmd: 'revokeLocal' })
  renderPairing()
})

let renderTimer = null
api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'state') {
    if (document.activeElement && document.activeElement.id === 'code') return
    clearTimeout(renderTimer)
    renderTimer = setTimeout(render, 120)
  }
  if (msg && msg.type === 'locale') {
    rpSetLocale(msg.locale)
    applyStaticText()
    render()
    loadPrefs()
  }
})

function applyStaticText() {
  document.documentElement.lang = rpGetLocale()
  document.getElementById('tagline').textContent = t('tagline')
  document.getElementById('foot-text').textContent = t('footLocal')
  revokeEl.textContent = t('forget')
}

rpInitI18n().then(() => {
  applyStaticText()
  renderLoading()
  render()
  loadPrefs()
})
