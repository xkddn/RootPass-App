const api = globalThis.browser || globalThis.chrome
const ICON_SIZE = 22
const attached = new WeakSet()
let host = null
let shadow = null
let iconEl = null
let panelEl = null
let anchorField = null
let activePassword = null
let autoSubmit = false

const ICON_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

function ensureHost() {
  if (host) return
  host = document.createElement('div')
  host.style.cssText = 'all:initial;position:absolute;top:0;left:0;z-index:2147483647;'
  shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = `
    :host { all: initial; }
    .rp-icon {
      position: absolute; display: flex; align-items: center; justify-content: center;
      width: ${ICON_SIZE}px; height: ${ICON_SIZE}px; border-radius: 7px; cursor: pointer;
      background: #0c0c0f; color: #34d399; border: 1px solid rgba(52,211,153,.35);
      box-shadow: 0 2px 8px rgba(0,0,0,.35); transition: background .15s, transform .15s;
      font-family: system-ui, sans-serif;
    }
    .rp-icon:hover { background: #14141a; transform: translateY(-1px); }
    .rp-panel {
      position: absolute; min-width: 240px; max-width: 320px; max-height: 320px; overflow-y: auto;
      background: #0c0c0f; border: 1px solid rgba(255,255,255,.08); border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,.6); padding: 6px; color: #e4e4e7;
      font-family: system-ui, sans-serif; font-size: 13px;
    }
    .rp-head { padding: 8px 10px 6px; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: #71717a; }
    .rp-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px;
      cursor: pointer; transition: background .12s;
    }
    .rp-item:hover { background: rgba(255,255,255,.05); }
    .rp-logo {
      width: 26px; height: 26px; border-radius: 8px; flex: none; display: flex; align-items: center;
      justify-content: center; background: rgba(52,211,153,.12); color: #34d399; font-weight: 700; font-size: 12px;
    }
    .rp-meta { min-width: 0; }
    .rp-title { font-weight: 600; color: #fafafa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rp-sub { color: #71717a; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rp-empty { padding: 12px 10px; color: #71717a; font-size: 12px; }
    .rp-2fa { margin-left: auto; flex: none; font-size: 10px; color: #34d399; border: 1px solid rgba(52,211,153,.3); border-radius: 999px; padding: 1px 6px; }
    .rp-save {
      position: fixed; right: 18px; bottom: 18px; width: 320px; box-sizing: border-box;
      background: #0c0c0f; border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
      box-shadow: 0 18px 50px rgba(0,0,0,.6); padding: 16px; color: #e4e4e7;
      font-family: system-ui, sans-serif; animation: rp-slide .22s ease-out;
    }
    @keyframes rp-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .rp-save-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .rp-save-badge {
      width: 30px; height: 30px; border-radius: 9px; flex: none; display: flex; align-items: center;
      justify-content: center; background: rgba(52,211,153,.12); color: #34d399;
    }
    .rp-save-title { font-size: 13px; font-weight: 700; color: #fafafa; line-height: 1.3; }
    .rp-save-sub { font-size: 12px; color: #a1a1aa; margin: 0 0 14px; word-break: break-all; }
    .rp-save-actions { display: flex; align-items: center; gap: 8px; }
    .rp-btn {
      font: inherit; font-size: 12.5px; font-weight: 600; border-radius: 999px; padding: 9px 14px;
      cursor: pointer; border: 1px solid transparent; transition: background .15s, transform .15s, color .15s;
    }
    .rp-btn-primary { background: #34d399; color: #06160f; }
    .rp-btn-primary:hover { background: #6ee7b7; transform: translateY(-1px); }
    .rp-btn-ghost { background: rgba(255,255,255,.05); color: #d4d4d8; border-color: rgba(255,255,255,.08); }
    .rp-btn-ghost:hover { background: rgba(255,255,255,.1); }
    .rp-btn-never { background: transparent; color: #71717a; margin-left: auto; padding: 9px 6px; }
    .rp-btn-never:hover { color: #f87171; }
  `
  shadow.appendChild(style)
  document.documentElement.appendChild(host)
}

function isVisible(el) {
  if (!el) return false
  const rect = el.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) return false
  const cs = getComputedStyle(el)
  return cs.visibility !== 'hidden' && cs.display !== 'none' && el.type !== 'hidden'
}

function isUsernameLike(el) {
  if (!isVisible(el)) return false
  const type = (el.getAttribute('type') || 'text').toLowerCase()
  if (type === 'email') return true
  if (!['text', 'tel', 'username', ''].includes(type)) return false
  const ac = (el.autocomplete || el.getAttribute('autocomplete') || '').toLowerCase()
  if (ac === 'username' || ac === 'email') return true
  const hint = (
    el.name +
    ' ' +
    el.id +
    ' ' +
    (el.placeholder || '') +
    ' ' +
    (el.getAttribute('aria-label') || '')
  ).toLowerCase()
  return /e-?mail|user|login|identifi|account|t[ée]l|phone|mobile/.test(hint)
}

function findUsernameFor(passwordField) {
  const scope = passwordField.form || document
  const candidates = [...scope.querySelectorAll('input')].filter((el) => {
    const type = (el.getAttribute('type') || 'text').toLowerCase()
    return ['text', 'email', 'tel', 'username', ''].includes(type) && isVisible(el)
  })
  let best = null
  for (const el of candidates) {
    const pos = el.compareDocumentPosition(passwordField)
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) best = el
  }
  return best || candidates[0] || null
}

function findUsernameField() {
  const inputs = [...document.querySelectorAll('input')]
  const likes = inputs.filter(isUsernameLike)
  if (likes.length) return likes[0]
  const textish = inputs.filter((el) => {
    const type = (el.getAttribute('type') || 'text').toLowerCase()
    return ['text', 'email', 'tel', ''].includes(type) && isVisible(el)
  })
  return textish.length === 1 ? textish[0] : null
}

function nativeSetValue(el, value) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function findSubmitButton(field) {
  const scope = field.form || document
  const candidates = [...scope.querySelectorAll('button, input[type="submit"], [role="button"]')]
  return (
    candidates.find(
      (b) =>
        isVisible(b) &&
        !b.disabled &&
        (b.type === 'submit' ||
          (b.tagName === 'BUTTON' && b.type !== 'button' && b.type !== 'reset'))
    ) ||
    candidates.find((b) => isVisible(b) && !b.disabled) ||
    null
  )
}

function submitForm(field) {
  const btn = findSubmitButton(field)
  if (btn) {
    btn.click()
    return
  }
  const form = field.form
  if (form && typeof form.requestSubmit === 'function') {
    try {
      form.requestSubmit()
      return
    } catch {
      void 0
    }
  }
  const opts = { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }
  field.dispatchEvent(new KeyboardEvent('keydown', opts))
  field.dispatchEvent(new KeyboardEvent('keypress', opts))
  field.dispatchEvent(new KeyboardEvent('keyup', opts))
}

function maybeSubmit(enabled, user, pwd, filledUser, filledPwd) {
  if (!enabled) return
  if (filledPwd && pwd) {
    setTimeout(() => submitForm(pwd), 200)
    return
  }
  if (filledUser && user && !pwd) {
    const scope = user.form || document
    const visibleInputs = [...scope.querySelectorAll('input')].filter(
      (el) => isVisible(el) && el.type !== 'hidden'
    )
    if (visibleInputs.length === 1) setTimeout(() => submitForm(user), 200)
  }
}

function fillFields(secret) {
  let pwd =
    activePassword && document.contains(activePassword) && isVisible(activePassword)
      ? activePassword
      : null
  if (!pwd) pwd = [...document.querySelectorAll('input[type="password"]')].find(isVisible) || null

  let user = pwd ? findUsernameFor(pwd) : null
  if (!user) {
    const af = document.activeElement
    user = af && af.tagName === 'INPUT' && isUsernameLike(af) ? af : findUsernameField()
  }

  let filledUser = false
  let filledPwd = false
  if (user && secret.login) {
    user.focus()
    nativeSetValue(user, secret.login)
    filledUser = true
  }
  if (pwd && secret.password) {
    pwd.focus()
    nativeSetValue(pwd, secret.password)
    filledPwd = true
  }
  if (secret.totp) {
    const otp = [...document.querySelectorAll('input')].find(
      (el) =>
        isVisible(el) &&
        (el.autocomplete === 'one-time-code' || /otp|totp|2fa|code/i.test(el.name + ' ' + el.id))
    )
    if (otp) nativeSetValue(otp, secret.totp)
  }
  hidePanel()
  const doSubmit = typeof secret.autoSubmit === 'boolean' ? secret.autoSubmit : autoSubmit
  maybeSubmit(doSubmit, user, pwd, filledUser, filledPwd)
}

let saveBarEl = null
let lastSaveSig = null

function removeSaveBar() {
  if (saveBarEl) {
    saveBarEl.remove()
    saveBarEl = null
  }
}

function showSaveBar(login, domain) {
  ensureHost()
  removeSaveBar()
  saveBarEl = document.createElement('div')
  saveBarEl.className = 'rp-save'
  saveBarEl.innerHTML = `
    <div class="rp-save-head">
      <div class="rp-save-badge">${ICON_SVG}</div>
      <div class="rp-save-title">${t('saveTitle')}</div>
    </div>
    <div class="rp-save-sub"></div>
    <div class="rp-save-actions">
      <button class="rp-btn rp-btn-primary" data-act="save">${t('saveBtn')}</button>
      <button class="rp-btn rp-btn-ghost" data-act="later">${t('saveNotNow')}</button>
      <button class="rp-btn rp-btn-never" data-act="never">${t('saveNever')}</button>
    </div>
  `
  saveBarEl.querySelector('.rp-save-sub').textContent = login ? login + ' · ' + domain : domain
  saveBarEl.addEventListener('mousedown', (e) => {
    const btn = e.target.closest && e.target.closest('button')
    if (!btn) return
    e.preventDefault()
    const act = btn.dataset.act
    if (act === 'save') api.runtime.sendMessage({ cmd: 'confirmSave' }).catch(() => {})
    else if (act === 'later') api.runtime.sendMessage({ cmd: 'dismissSave' }).catch(() => {})
    else if (act === 'never') api.runtime.sendMessage({ cmd: 'neverSave', domain }).catch(() => {})
    removeSaveBar()
  })
  shadow.appendChild(saveBarEl)
}

function currentLoginPair() {
  const pwd = [...document.querySelectorAll('input[type="password"]')].find(
    (el) => isVisible(el) && el.value
  )
  if (!pwd) return null
  const user = findUsernameFor(pwd)
  return { login: user && user.value ? user.value : '', password: pwd.value }
}

function captureLoginAttempt() {
  const pair = currentLoginPair()
  if (!pair || !pair.password) return
  const sig = pair.login + ' ' + pair.password
  if (sig === lastSaveSig) return
  lastSaveSig = sig
  api.runtime
    .sendMessage({ cmd: 'maybeSave', url: location.href, login: pair.login, password: pair.password })
    .catch(() => {})
}

function positionIcon() {
  if (!iconEl || !anchorField || !document.contains(anchorField)) {
    hideIcon()
    return
  }
  const rect = anchorField.getBoundingClientRect()
  if (rect.width < 8) {
    hideIcon()
    return
  }
  const top = window.scrollY + rect.top + (rect.height - ICON_SIZE) / 2
  const left = window.scrollX + rect.right - ICON_SIZE - 8
  iconEl.style.top = top + 'px'
  iconEl.style.left = left + 'px'
}

function showIconFor(field) {
  ensureHost()
  anchorField = field
  if (!iconEl) {
    iconEl = document.createElement('div')
    iconEl.className = 'rp-icon'
    iconEl.innerHTML = ICON_SVG
    iconEl.title = 'RootPass'
    iconEl.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      togglePanel()
    })
    shadow.appendChild(iconEl)
  }
  iconEl.style.display = 'flex'
  positionIcon()
}

function hideIcon() {
  if (iconEl) iconEl.style.display = 'none'
}

function hidePanel() {
  if (panelEl) {
    panelEl.remove()
    panelEl = null
  }
}

async function togglePanel() {
  if (panelEl) {
    hidePanel()
    return
  }
  ensureHost()
  panelEl = document.createElement('div')
  panelEl.className = 'rp-panel'
  panelEl.innerHTML = `<div class="rp-empty">${t('contentLoading')}</div>`
  shadow.appendChild(panelEl)
  positionPanel()

  let res
  try {
    res = await api.runtime.sendMessage({ cmd: 'query', url: location.href })
  } catch {
    res = { error: 'disconnected' }
  }
  if (!panelEl) return

  if (res && res.error === 'locked') {
    panelEl.innerHTML = `<div class="rp-empty">${t('contentLocked')}</div>`
    return
  }
  if (!res || res.error || !res.items) {
    panelEl.innerHTML = `<div class="rp-empty">${t('contentNotConnected')}</div>`
    return
  }
  if (!res.items.length) {
    panelEl.innerHTML = `<div class="rp-empty">${t('contentNoAccounts')}</div>`
    return
  }

  panelEl.innerHTML = `<div class="rp-head">${t('contentAccountsForSite')}</div>`
  for (const item of res.items) {
    const row = document.createElement('div')
    row.className = 'rp-item'
    const initials = (item.title || '?').trim().slice(0, 2).toUpperCase()
    row.innerHTML = `
      <div class="rp-logo">${initials}</div>
      <div class="rp-meta">
        <div class="rp-title"></div>
        <div class="rp-sub"></div>
      </div>
      ${item.hasTotp ? '<span class="rp-2fa">2FA</span>' : ''}
    `
    row.querySelector('.rp-title').textContent = item.title || ''
    row.querySelector('.rp-sub').textContent = item.login || ''
    row.addEventListener('mousedown', async (e) => {
      e.preventDefault()
      const fillRes = await api.runtime.sendMessage({
        cmd: 'fill',
        id: item.id,
        fields: ['login', 'password', 'totp']
      })
      if (fillRes && fillRes.secret) fillFields(fillRes.secret)
    })
    panelEl.appendChild(row)
  }
}

function positionPanel() {
  if (!panelEl || !anchorField) return
  const rect = anchorField.getBoundingClientRect()
  panelEl.style.top = window.scrollY + rect.bottom + 6 + 'px'
  panelEl.style.left = window.scrollX + rect.left + 'px'
}

function attachField(field, kind) {
  if (attached.has(field)) return
  attached.add(field)
  const onFocus = () => {
    if (kind === 'password') activePassword = field
    showIconFor(field)
  }
  field.addEventListener('focus', onFocus)
  if (field === document.activeElement) onFocus()
}

function scan() {
  const pwds = [...document.querySelectorAll('input[type="password"]')].filter(isVisible)
  for (const p of pwds) attachField(p, 'password')
  const users = [...document.querySelectorAll('input')].filter(isUsernameLike)
  for (const u of users) attachField(u, 'username')
}

let scanTimer = null
function scheduleScan() {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scan, 400)
}

const observer = new MutationObserver(scheduleScan)
observer.observe(document.documentElement, { childList: true, subtree: true })

window.addEventListener(
  'scroll',
  () => {
    positionIcon()
    positionPanel()
  },
  true
)
window.addEventListener('resize', () => {
  positionIcon()
  positionPanel()
})
document.addEventListener('mousedown', (e) => {
  if (panelEl && host && !e.composedPath().includes(host)) hidePanel()
})

async function rpInitAutoSubmit() {
  try {
    const data = await api.storage.local.get('appAutoSubmit')
    autoSubmit = !!data.appAutoSubmit
  } catch {
    void 0
  }
}

document.addEventListener('submit', captureLoginAttempt, true)
document.addEventListener(
  'click',
  (e) => {
    const btn = e.target && e.target.closest && e.target.closest('button, input[type="submit"], [role="button"]')
    if (btn) captureLoginAttempt()
  },
  true
)
document.addEventListener(
  'keydown',
  (e) => {
    const el = e.target
    if (e.key === 'Enter' && el && el.tagName === 'INPUT' && el.type === 'password') {
      captureLoginAttempt()
    }
  },
  true
)

api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.cmd === 'doFill' && msg.secret) fillFields(msg.secret)
  if (msg && msg.type === 'locale') {
    rpSetLocale(msg.locale)
    if (panelEl) {
      hidePanel()
      togglePanel()
    }
  }
  if (msg && msg.type === 'autosubmit') autoSubmit = !!msg.value
  if (msg && msg.cmd === 'offerSave') showSaveBar(msg.login || '', msg.domain || '')
  if (msg && msg.cmd === 'saveDone') removeSaveBar()
})

rpInitI18n()
rpInitAutoSubmit()
scan()
