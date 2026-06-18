const api = globalThis.browser || globalThis.chrome
const statusEl = document.getElementById('status')
const bodyEl = document.getElementById('body')
const revokeEl = document.getElementById('revoke')
const footText = document.getElementById('foot-text')

function setStatus(label, cls) {
  statusEl.textContent = label
  statusEl.className = 'status' + (cls ? ' ' + cls : '')
}

async function activeUrl() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  return tab ? tab.url : null
}

function domainLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function renderPairing(error) {
  setStatus(t('statusNotConnected'))
  revokeEl.hidden = true
  bodyEl.innerHTML = `
    <p class="intro">${t('pairIntro')}</p>
    <input id="code" class="code-input" inputmode="numeric" maxlength="6" placeholder="000000" />
    <button id="pair" class="btn">${t('pairButton')}</button>
    ${error ? `<div class="err">${error}</div>` : ''}
  `
  const codeEl = document.getElementById('code')
  const pairBtn = document.getElementById('pair')
  codeEl.focus()
  codeEl.addEventListener('input', () => {
    codeEl.value = codeEl.value.replace(/\D/g, '').slice(0, 6)
  })
  codeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pairBtn.click()
  })
  pairBtn.addEventListener('click', async () => {
    if (codeEl.value.length !== 6) return
    pairBtn.disabled = true
    pairBtn.textContent = t('pairing')
    const res = await api.runtime.sendMessage({ cmd: 'pair', code: codeEl.value })
    if (res && res.ok) {
      render()
    } else {
      const reason =
        res && res.reason === 'bad_code'
          ? t('errBadCode')
          : res && (res.reason === 'expired' || res.reason === 'too_many')
            ? t('errExpired')
            : t('errPairFailed')
      renderPairing(reason)
    }
  })
}

function renderLocked() {
  setStatus(t('statusLocked'), 'warn')
  revokeEl.hidden = false
  bodyEl.innerHTML = `<div class="empty">${t('lockedBody')}</div>`
}

async function renderAccounts() {
  setStatus(t('statusConnected'), 'ok')
  revokeEl.hidden = false
  const url = await activeUrl()
  if (!url || !/^https?:/.test(url)) {
    bodyEl.innerHTML = `<div class="empty">${t('openSite')}</div>`
    return
  }
  bodyEl.innerHTML = `<div class="loading">${t('searching')}</div>`
  const res = await api.runtime.sendMessage({ cmd: 'query', url })

  if (res && res.error === 'locked') return renderLocked()
  if (!res || res.error) {
    bodyEl.innerHTML = `<div class="empty">${t('notConnectedBody')}</div>`
    return
  }
  if (!res.items || !res.items.length) {
    bodyEl.innerHTML = `<div class="empty">${t('noAccountsFor')}<br /><b>${domainLabel(url)}</b></div>`
    return
  }

  const list = document.createElement('div')
  list.className = 'list'
  const head = document.createElement('div')
  head.className = 'site'
  head.textContent = domainLabel(url)
  list.appendChild(head)

  for (const item of res.items) {
    const row = document.createElement('div')
    row.className = 'item'
    const initials = (item.title || '?').trim().slice(0, 2).toUpperCase()
    row.innerHTML = `
      <div class="logo">${initials}</div>
      <div class="meta"><div class="title"></div><div class="sub"></div></div>
      ${item.hasTotp ? '<span class="badge2fa">2FA</span>' : ''}
    `
    row.querySelector('.title').textContent = item.title || ''
    row.querySelector('.sub').textContent = item.login || ''
    row.addEventListener('click', async () => {
      await api.runtime.sendMessage({ cmd: 'fillActive', id: item.id })
      window.close()
    })
    list.appendChild(row)
  }
  bodyEl.innerHTML = ''
  bodyEl.appendChild(list)
}

async function render() {
  const state = await api.runtime.sendMessage({ cmd: 'getState' })
  if (!state || state.wsState !== 'open') {
    setStatus(t('statusOffline'))
    revokeEl.hidden = false
    bodyEl.innerHTML = `<div class="empty">${t('appNotFound')}</div>`
    return
  }
  if (state.appState === 'ready') return renderAccounts()
  if (state.appState === 'locked') return renderLocked()
  renderPairing()
}

revokeEl.addEventListener('click', async () => {
  await api.runtime.sendMessage({ cmd: 'revokeLocal' })
  renderPairing()
})

api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'state') render()
  if (msg && msg.type === 'locale') {
    rpSetLocale(msg.locale)
    applyStaticText()
    render()
  }
})

function applyStaticText() {
  revokeEl.textContent = t('forget')
  footText.textContent = t('footLocal')
}

rpInitI18n().then(() => {
  applyStaticText()
  bodyEl.innerHTML = `<div class="loading">${t('connecting')}</div>`
  render()
})
