const api = globalThis.browser || globalThis.chrome
const attached = new WeakSet()
const SAVE_TIMEOUT_MS = 10000
const QUERY_CACHE_MS = 15000
const SUBMIT_WORDS =
  /connexion|connecter|se connecter|log ?in|sign ?in|sign ?up|s'inscrire|inscription|register|cr[ée]er|create|continuer|continue|suivant|next|valider|submit|envoyer|send|enregistrer|save|confirm/i

let host = null
let shadow = null
let iconEl = null
let panelEl = null
let saveEl = null
let anchorField = null
let activePassword = null
let autoSubmit = false
let iconOffset = null
let blurTimer = null
let activeIndex = -1
let panelItems = []
let queryCache = null
let lastSaveSig = null

const LOGO_SVG = `<svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="rp-logo-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a78c0"/><stop offset="1" stop-color="#2a46d6"/></linearGradient></defs><circle cx="64" cy="64" r="64" fill="url(#rp-logo-g)"/><circle cx="64" cy="36" r="9" fill="#ffffff"/><g fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M64 52V94"/><path d="M64 66C64 80 44 80 36 96"/><path d="M64 66C64 80 84 80 92 96"/></g></svg>`

const ICONS = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  plug: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>'
}

const STYLE = `
:host { all: initial; }
.rp {
  --card: #ffffff; --shell: #eef0f4; --ink: #1b1d23; --ink2: #4f5562; --mute: #5a616e; --faint: #a6adb9;
  --line: #e1e4ea; --accent: #2457e6; --on-accent: #ffffff; --accent-soft: #e4ecfd;
  --good: #17703a; --good-soft: #e0f2e7; --bad: #b82d35; --bad-soft: #fbe9ea; --warn: #8f5400; --warn-soft: #f6ead6;
  --pop: 0 0 0 1px rgba(27,29,35,.07), 0 24px 48px -16px rgba(20,20,40,.35);
  --feature: linear-gradient(135deg, #0a78c0 0%, #2a46d6 100%);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
  color: var(--ink); font-size: 14px; line-height: 1.35; -webkit-font-smoothing: antialiased;
}
@media (prefers-color-scheme: dark) {
  .rp {
    --card: #28282d; --shell: #1f1f23; --ink: #f4f4f6; --ink2: #b9b9c2; --mute: #9a9aa4; --faint: #5a5a64;
    --line: #34343a; --accent: #7ea2ff; --on-accent: #10131c; --accent-soft: rgba(126,162,255,.14);
    --good: #5fd08a; --good-soft: rgba(95,208,138,.14); --bad: #ff8a8e; --bad-soft: rgba(255,138,142,.14);
    --warn: #f0b45a; --warn-soft: rgba(240,180,90,.14);
    --pop: 0 0 0 1px rgba(255,255,255,.07), 0 24px 48px -16px rgba(0,0,0,.7);
  }
}
.rp *, .rp *::before, .rp *::after { box-sizing: border-box; margin: 0; padding: 0; font: inherit; color: inherit; }
.rp svg { display: block; }
.ico svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.rp-icon {
  position: absolute; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  cursor: pointer; background: transparent; border: none; padding: 0;
  transition: transform .15s ease, opacity .15s ease, filter .15s ease;
  filter: drop-shadow(0 2px 4px rgba(20,20,40,.25));
}
.rp-icon svg { width: 100%; height: 100%; }
.rp-icon:hover { transform: scale(1.1); }
.rp-icon.dim { opacity: .55; filter: grayscale(.4); }
.rp-icon .count {
  position: absolute; top: -4px; right: -5px; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 999px;
  background: var(--card); color: var(--accent); font-size: 10px; font-weight: 800; line-height: 14px; text-align: center;
  box-shadow: 0 0 0 1px var(--line);
}

.rp-panel {
  position: absolute; width: 320px; max-width: calc(100vw - 16px); background: var(--card); border-radius: 22px;
  box-shadow: var(--pop); padding: 6px; animation: rp-pop .14s cubic-bezier(.16,1,.3,1);
}
.rp-panel.up { animation-name: rp-pop-up; }
.rp-panel:focus { outline: none; }
.rp-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px; }
.rp-head .logo { width: 18px; height: 18px; flex: none; }
.rp-head .name { font-size: 13px; font-weight: 700; }
.rp-chip {
  margin-left: auto; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 11px; font-weight: 600; color: var(--mute); background: var(--shell); border-radius: 999px; padding: 3px 9px;
}
.rp-list { max-height: 264px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.rp-item {
  display: flex; align-items: center; gap: 11px; width: 100%; padding: 7px 10px 7px 7px; border-radius: 16px;
  cursor: pointer; text-align: left; background: transparent; border: none; transition: background .12s;
}
.rp-item.on { background: var(--shell); }
.tile {
  width: 34px; height: 34px; flex: none; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 13px; text-transform: uppercase;
}
.meta { min-width: 0; flex: 1; }
.t1 { font-weight: 650; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t2 { font-size: 12px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { flex: none; font-size: 11px; font-weight: 700; color: var(--ink2); background: var(--shell); border-radius: 999px; padding: 2px 8px; }
.rp-item.on .badge { background: var(--card); }
.rp-foot { display: flex; gap: 12px; padding: 8px 10px 6px; font-size: 11px; color: var(--faint); }
.rp-foot kbd { font-family: inherit; font-weight: 700; color: var(--mute); }
.rp-state { display: flex; align-items: center; gap: 12px; padding: 10px 10px 12px; }
.rp-state .ico-wrap {
  width: 34px; height: 34px; flex: none; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: var(--shell); color: var(--mute);
}
.rp-state .ico-wrap.warn { background: var(--warn-soft); color: var(--warn); }
.rp-state .ico { width: 17px; height: 17px; }
.rp-state .t2 { white-space: normal; }

.rp-save {
  position: fixed; top: 16px; right: 16px; width: 360px; max-width: calc(100vw - 32px); background: var(--card);
  border-radius: 26px; box-shadow: var(--pop); overflow: hidden; animation: rp-drop .26s cubic-bezier(.16,1,.3,1);
}
.rp-save.out { animation: rp-lift .18s ease-in forwards; }
.rp-save-in { padding: 18px 18px 16px; }
.rp-save-top { display: flex; align-items: center; gap: 10px; }
.rp-save-top .logo { width: 22px; height: 22px; flex: none; }
.rp-save-top .label { font-size: 12px; font-weight: 700; color: var(--mute); }
.rp-close {
  margin-left: auto; width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--mute); transition: background .12s, color .12s;
}
.rp-close:hover { background: var(--shell); color: var(--ink); }
.rp-close .ico { width: 15px; height: 15px; }
.rp-save h2 { margin-top: 12px; font-size: 17px; font-weight: 750; letter-spacing: -.01em; }
.rp-save .lead { margin-top: 3px; font-size: 13px; color: var(--mute); }
.rp-card { margin-top: 14px; display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 10px; border-radius: 18px; background: var(--shell); }
.rp-card .tile { background: var(--feature); color: #fff; }
.dots { font-size: 12px; letter-spacing: 2px; color: var(--faint); margin-top: 1px; }
.rp-actions { margin-top: 14px; display: flex; align-items: center; gap: 8px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 0 16px; border-radius: 999px;
  border: none; cursor: pointer; font-size: 13px; font-weight: 700; white-space: nowrap;
  transition: filter .15s, background .15s, color .15s, transform .15s;
}
.btn:active { transform: scale(.97); }
.btn:disabled { opacity: .6; cursor: default; transform: none; }
.btn .ico { width: 15px; height: 15px; }
.btn-primary { background: var(--accent); color: var(--on-accent); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-soft { background: var(--shell); color: var(--ink2); }
.btn-soft:hover { color: var(--ink); filter: brightness(.97); }
.btn-link { margin-left: auto; padding: 0 4px; background: transparent; color: var(--mute); font-weight: 600; font-size: 12px; }
.btn-link:hover { color: var(--bad); }
.rp-msg { margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px; font-size: 13px; font-weight: 600; }
.rp-msg .ico { width: 17px; height: 17px; flex: none; }
.rp-msg.ok { background: var(--good-soft); color: var(--good); }
.rp-msg.err { background: var(--bad-soft); color: var(--bad); }
.fuse { height: 3px; background: var(--shell); }
.fuse i { display: block; height: 100%; background: var(--accent); transform-origin: left center; animation: rp-fuse linear forwards; }
.rp-save:hover .fuse i { animation-play-state: paused; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@keyframes rp-pop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes rp-pop-up { from { opacity: 0; transform: translateY(4px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes rp-drop { from { opacity: 0; transform: translateY(-14px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes rp-lift { to { opacity: 0; transform: translateY(-10px) scale(.98); } }
@keyframes rp-fuse { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) {
  .rp-panel, .rp-save, .rp-save.out { animation: none; }
  .rp-icon, .rp-item, .btn { transition: none; }
}
`

function el(tag, cls, html) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (html != null) node.innerHTML = html
  return node
}

function icon(name) {
  return `<span class="ico">${ICONS[name]}</span>`
}

function ensureHost() {
  if (host && document.documentElement.contains(host)) return
  host = document.createElement('rootpass-ui')
  host.style.cssText =
    'all:initial;position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;'
  shadow = host.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = STYLE
  shadow.appendChild(style)
  document.documentElement.appendChild(host)
}

function mount(node) {
  ensureHost()
  const wrap = el('div', 'rp')
  wrap.appendChild(node)
  shadow.appendChild(wrap)
  return wrap
}

function siteLabel() {
  return location.hostname.replace(/^www\./, '')
}

function initialOf(text) {
  const clean = (text || '?')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .trim()
  return clean.charAt(0) || '?'
}

function isVisible(field) {
  if (!field || !field.isConnected) return false
  const rect = field.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) return false
  const cs = getComputedStyle(field)
  return cs.visibility !== 'hidden' && cs.display !== 'none' && field.type !== 'hidden'
}

function inputType(field) {
  return (field.getAttribute('type') || 'text').toLowerCase()
}

function autocompleteOf(field) {
  return (field.autocomplete || field.getAttribute('autocomplete') || '').toLowerCase()
}

function isTextish(field) {
  return ['text', 'email', 'tel', 'username', ''].includes(inputType(field))
}

function hasUsernameAutocomplete(field) {
  const ac = autocompleteOf(field)
  return ac.includes('username') || ac === 'email'
}

function isUsernameLike(field) {
  if (!isVisible(field)) return false
  if (inputType(field) === 'email') return true
  if (!isTextish(field)) return false
  if (hasUsernameAutocomplete(field)) return true
  const hint = [field.name, field.id, field.placeholder, field.getAttribute('aria-label')]
    .join(' ')
    .toLowerCase()
  return /e-?mail|user|login|identifi|account|compte|pseudo|t[ée]l[ée]phone|phone|mobile/.test(hint)
}

function hasStrongUsernameSignal(field) {
  return isVisible(field) && isTextish(field) && hasUsernameAutocomplete(field)
}

function findUsernameFor(passwordField) {
  const scope = passwordField.form || document
  const candidates = [...scope.querySelectorAll('input')].filter(
    (f) => isTextish(f) && isVisible(f)
  )
  let best = null
  for (const f of candidates) {
    if (f.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) best = f
  }
  return best || candidates[0] || null
}

function findHiddenUsername(scope) {
  const hidden = [...(scope || document).querySelectorAll('input')].find(
    (f) => hasUsernameAutocomplete(f) && f.value && !isVisible(f)
  )
  return hidden ? hidden.value : ''
}

function findUsernameField() {
  const inputs = [...document.querySelectorAll('input')]
  const likes = inputs.filter(isUsernameLike)
  if (likes.length) return likes[0]
  const textish = inputs.filter((f) => isTextish(f) && isVisible(f))
  return textish.length === 1 ? textish[0] : null
}

function visiblePasswords() {
  return [...document.querySelectorAll('input[type="password"]')].filter(isVisible)
}

function nativeSetValue(field, value) {
  const proto =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
  field.dispatchEvent(new Event('change', { bubbles: true }))
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
    candidates.find((b) => isVisible(b) && !b.disabled && SUBMIT_WORDS.test(buttonText(b))) ||
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
  const opts = {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13
  }
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
    const inputs = [...scope.querySelectorAll('input')].filter(isVisible)
    if (inputs.length === 1) setTimeout(() => submitForm(user), 200)
  }
}

function fillFields(secret) {
  let pwd = activePassword && isVisible(activePassword) ? activePassword : null
  if (!pwd) pwd = visiblePasswords()[0] || null

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
  if (secret.password) lastSaveSig = (secret.login || '') + '\u0000' + secret.password
  if (secret.totp) {
    const otp = [...document.querySelectorAll('input')].find(
      (f) =>
        isVisible(f) &&
        (autocompleteOf(f) === 'one-time-code' || /otp|totp|2fa|code/i.test(f.name + ' ' + f.id))
    )
    if (otp) nativeSetValue(otp, secret.totp)
  }
  hidePanel()
  const doSubmit = typeof secret.autoSubmit === 'boolean' ? secret.autoSubmit : autoSubmit
  maybeSubmit(doSubmit, user, pwd, filledUser, filledPwd)
}

async function querySite(force) {
  if (!force && queryCache && Date.now() - queryCache.at < QUERY_CACHE_MS) return queryCache.res
  let res
  try {
    res = await api.runtime.sendMessage({ cmd: 'query', url: location.href })
  } catch {
    res = { error: 'disconnected' }
  }
  queryCache = { at: Date.now(), res }
  return res
}

function isObstacle(node, field) {
  if (!node || node === field || node === host) return false
  if (node.contains(field) || field.contains(node)) return false
  if (node.closest('button, a, [role="button"], [tabindex]')) return true
  const tag = node.tagName.toLowerCase()
  if (['svg', 'path', 'use', 'img', 'i', 'g', 'circle', 'rect'].includes(tag)) return true
  return getComputedStyle(node).cursor === 'pointer'
}

function iconSize(rect) {
  return Math.max(16, Math.min(22, rect.height - 10))
}

function computeIconOffset(field) {
  const rect = field.getBoundingClientRect()
  const size = iconSize(rect)
  const cy = rect.top + rect.height / 2
  const minX = rect.left + rect.width * 0.45
  let obstacleLeft = null
  let gap = 0
  for (let x = rect.right - 3; x > minX; x -= 2) {
    const stack = document.elementsFromPoint(x, cy).filter((n) => n !== host)
    const top = stack[0]
    if (isObstacle(top, field)) {
      obstacleLeft = x
      gap = 0
    } else if (obstacleLeft !== null) {
      gap += 2
      if (gap >= size + 6) break
    }
  }
  const right = obstacleLeft !== null ? obstacleLeft - 6 : rect.right - 8
  return { fromRight: rect.right - right, size }
}

function positionIcon() {
  if (!iconEl || !anchorField || !isVisible(anchorField)) {
    hideIcon()
    return
  }
  const rect = anchorField.getBoundingClientRect()
  if (!iconOffset) iconOffset = computeIconOffset(anchorField)
  const { fromRight, size } = iconOffset
  iconEl.style.width = size + 'px'
  iconEl.style.height = size + 'px'
  iconEl.style.top = window.scrollY + rect.top + (rect.height - size) / 2 + 'px'
  iconEl.style.left = window.scrollX + rect.right - fromRight - size + 'px'
}

function setIconState(res) {
  if (!iconEl) return
  const count = res && Array.isArray(res.items) ? res.items.length : 0
  iconEl.classList.toggle('dim', !count)
  const badge = iconEl.querySelector('.count')
  if (count > 1) {
    badge.textContent = String(count)
    badge.hidden = false
  } else {
    badge.hidden = true
  }
}

function showIconFor(field) {
  clearTimeout(blurTimer)
  if (anchorField !== field) hidePanel()
  iconOffset = null
  anchorField = field
  if (!iconEl) {
    iconEl = el('button', 'rp-icon', LOGO_SVG + '<span class="count" hidden></span>')
    iconEl.type = 'button'
    iconEl.title = 'RootPass'
    iconEl.setAttribute('aria-label', 'RootPass')
    iconEl.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      togglePanel()
    })
    mount(iconEl)
  }
  iconEl.style.display = 'flex'
  positionIcon()
  querySite(false).then(setIconState)
}

function hideIcon() {
  if (iconEl) iconEl.style.display = 'none'
}

function hidePanel(refocus) {
  if (panelEl) {
    panelEl.parentNode.remove()
    panelEl = null
  }
  panelItems = []
  activeIndex = -1
  if (!anchorField) return
  if (refocus && isVisible(anchorField)) anchorField.focus({ preventScroll: true })
  else if (document.activeElement !== anchorField) hideIcon()
}

function setActive(index) {
  if (!panelItems.length) return
  activeIndex = (index + panelItems.length) % panelItems.length
  panelItems.forEach((row, i) => row.classList.toggle('on', i === activeIndex))
  panelItems[activeIndex].scrollIntoView({ block: 'nearest' })
}

async function pickItem(item) {
  let res
  try {
    res = await api.runtime.sendMessage({
      cmd: 'fill',
      id: item.id,
      fields: ['login', 'password', 'totp']
    })
  } catch {
    res = null
  }
  if (res && res.secret) fillFields(res.secret)
}

function stateBlock(iconName, title, sub, tone) {
  return `<div class="rp-state"><div class="ico-wrap ${tone || ''}">${icon(iconName)}</div><div class="meta"><div class="t1">${title}</div><div class="t2">${sub}</div></div></div>`
}

function panelHead() {
  const head = el(
    'div',
    'rp-head',
    `<span class="logo">${LOGO_SVG}</span><span class="name">RootPass</span>`
  )
  if (siteLabel()) {
    const chip = el('span', 'rp-chip')
    chip.textContent = siteLabel()
    head.appendChild(chip)
  }
  return head
}

function renderPanel(res) {
  if (!panelEl) return
  panelEl.innerHTML = ''
  panelEl.appendChild(panelHead())
  panelItems = []
  activeIndex = -1

  if (res && res.error === 'locked') {
    panelEl.insertAdjacentHTML(
      'beforeend',
      stateBlock('lock', t('contentLockedTitle'), t('contentLocked'), 'warn')
    )
    return
  }
  if (!res || res.error || !Array.isArray(res.items)) {
    panelEl.insertAdjacentHTML(
      'beforeend',
      stateBlock('plug', t('contentNotConnectedTitle'), t('contentNotConnected'))
    )
    return
  }
  if (!res.items.length) {
    panelEl.insertAdjacentHTML(
      'beforeend',
      stateBlock('search', t('contentNoAccountsTitle'), t('contentNoAccounts'))
    )
    return
  }

  const list = el('div', 'rp-list')
  list.setAttribute('role', 'listbox')
  res.items.forEach((item, i) => {
    const row = el(
      'button',
      'rp-item',
      `<span class="tile"></span><span class="meta"><span class="t1" style="display:block"></span><span class="t2" style="display:block"></span></span>${item.hasTotp ? '<span class="badge">2FA</span>' : ''}`
    )
    row.type = 'button'
    row.setAttribute('role', 'option')
    row.querySelector('.tile').textContent = initialOf(item.title)
    row.querySelector('.t1').textContent = item.title || siteLabel()
    row.querySelector('.t2').textContent = item.login || t('noLogin')
    row.addEventListener('mousedown', (e) => {
      e.preventDefault()
      pickItem(item)
    })
    row.addEventListener('mouseenter', () => setActive(i))
    list.appendChild(row)
    panelItems.push(row)
  })
  panelEl.appendChild(list)
  panelEl.appendChild(
    el(
      'div',
      'rp-foot',
      `<span><kbd>↑↓</kbd> ${t('kbdNavigate')}</span><span><kbd>↵</kbd> ${t('kbdFill')}</span><span><kbd>Esc</kbd> ${t('kbdClose')}</span>`
    )
  )
  panelEl._items = res.items
  setActive(0)
}

async function togglePanel(force) {
  if (panelEl && !force) {
    hidePanel()
    return
  }
  if (panelEl) {
    panelEl.parentNode.remove()
    panelEl = null
  }
  panelEl = el('div', 'rp-panel')
  panelEl.setAttribute('role', 'dialog')
  panelEl.setAttribute('aria-label', 'RootPass')
  panelEl.tabIndex = -1
  panelEl.addEventListener('keydown', onFieldKeydown)
  mount(panelEl)
  panelEl.focus({ preventScroll: true })
  panelEl.appendChild(panelHead())
  panelEl.insertAdjacentHTML('beforeend', stateBlock('search', t('contentLoading'), siteLabel()))
  positionPanel()
  const res = await querySite(true)
  setIconState(res)
  renderPanel(res)
  positionPanel()
}

function positionPanel() {
  if (!panelEl || !anchorField) return
  const rect = anchorField.getBoundingClientRect()
  const width = Math.min(Math.max(rect.width, 300), 360, window.innerWidth - 16)
  panelEl.style.width = width + 'px'
  const height = panelEl.offsetHeight || 200
  const below = window.innerHeight - rect.bottom
  const up = below < height + 12 && rect.top > height + 12
  panelEl.classList.toggle('up', up)
  const top = up ? rect.top - height - 8 : rect.bottom + 8
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
  panelEl.style.top = window.scrollY + top + 'px'
  panelEl.style.left = window.scrollX + left + 'px'
}

function onFieldKeydown(e) {
  if (!panelEl) {
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      togglePanel(true)
    }
    return
  }
  if (e.key === 'Escape' || e.key === 'Tab') {
    e.preventDefault()
    e.stopPropagation()
    hidePanel(true)
    return
  }
  if (!panelItems.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setActive(activeIndex + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setActive(activeIndex - 1)
  } else if (e.key === 'Enter' && activeIndex >= 0) {
    e.preventDefault()
    e.stopPropagation()
    pickItem(panelEl._items[activeIndex])
  }
}

function attachField(field, kind) {
  if (attached.has(field)) return
  attached.add(field)
  const onFocus = () => {
    if (kind === 'password') activePassword = field
    showIconFor(field)
  }
  field.addEventListener('focus', onFocus)
  field.addEventListener('blur', () => {
    clearTimeout(blurTimer)
    blurTimer = setTimeout(() => {
      if (!panelEl && anchorField === field) hideIcon()
    }, 180)
  })
  field.addEventListener('keydown', onFieldKeydown, true)
  if (kind === 'username') field.addEventListener('change', () => rememberLogin(field.value))
  if (field === document.activeElement) onFocus()
}

function rememberLogin(value) {
  const login = (value || '').trim()
  if (!login) return
  api.runtime.sendMessage({ cmd: 'rememberLogin', url: location.href, login }).catch(() => {})
}

function scan() {
  const pwds = visiblePasswords()
  for (const p of pwds) attachField(p, 'password')
  const linkedUsers = new Set(pwds.map(findUsernameFor).filter(Boolean))
  const strongUsers = [...document.querySelectorAll('input')].filter(hasStrongUsernameSignal)
  for (const u of new Set([...linkedUsers, ...strongUsers])) attachField(u, 'username')
  if (!pwds.length) {
    const lone = findUsernameField()
    if (lone && isUsernameLike(lone)) attachField(lone, 'username')
  }
}

function buttonText(btn) {
  return [btn.textContent, btn.value, btn.getAttribute('aria-label'), btn.title]
    .filter(Boolean)
    .join(' ')
    .trim()
}

function isSubmitLike(btn) {
  if (!btn || btn.disabled) return false
  if (btn.tagName === 'INPUT') return btn.type === 'submit'
  if (btn.tagName === 'BUTTON' && btn.type === 'submit' && btn.form) return true
  return SUBMIT_WORDS.test(buttonText(btn))
}

function currentLoginPair() {
  const pwds = visiblePasswords().filter((f) => f.value)
  if (!pwds.length) return null
  const pwd = pwds.find((f) => autocompleteOf(f).includes('new-password')) || pwds[0]
  const user = findUsernameFor(pwd)
  let login = user && user.value ? user.value.trim() : ''
  if (!login) login = findHiddenUsername(pwd.form || document)
  return { login, password: pwd.value }
}

function captureLoginAttempt() {
  const pair = currentLoginPair()
  if (!pair) {
    const user = findUsernameField()
    if (user && user.value) rememberLogin(user.value)
    return
  }
  const sig = pair.login + '\u0000' + pair.password
  if (sig === lastSaveSig) return
  lastSaveSig = sig
  api.runtime
    .sendMessage({
      cmd: 'maybeSave',
      url: location.href,
      login: pair.login,
      password: pair.password
    })
    .catch(() => {})
}

function closeSave() {
  if (!saveEl) return
  const node = saveEl
  saveEl = null
  node.classList.add('out')
  setTimeout(() => node.parentNode && node.parentNode.remove(), 180)
}

function showSave(offer) {
  if (saveEl) saveEl.parentNode.remove()
  const mode = offer.mode === 'update' || offer.mode === 'link' ? offer.mode : 'save'
  const isUpdate = mode !== 'save'
  const copy = {
    save: { title: t('saveTitle'), btn: t('saveBtn'), done: t('savedMsg') },
    update: { title: t('updateTitle'), btn: t('updateBtn'), done: t('updatedMsg') },
    link: { title: t('linkTitle'), btn: t('linkBtn'), done: t('linkedMsg') }
  }[mode]
  saveEl = el('div', 'rp-save')
  saveEl.setAttribute('role', 'dialog')
  saveEl.setAttribute('aria-live', 'polite')
  saveEl.innerHTML = `
    <div class="rp-save-in">
      <div class="rp-save-top">
        <span class="logo">${LOGO_SVG}</span>
        <span class="label">RootPass</span>
        <button class="rp-close" type="button" data-act="later" aria-label="${t('close')}">${icon('x')}</button>
      </div>
      <h2>${copy.title}</h2>
      <p class="lead"></p>
      <div class="rp-card">
        <span class="tile"></span>
        <span class="meta"><span class="t1" style="display:block"></span><span class="t2" style="display:block"></span><span class="dots" style="display:block">••••••••••</span></span>
      </div>
      <div class="rp-actions">
        <button class="btn btn-primary" type="button" data-act="save">${copy.btn}</button>
        <button class="btn btn-soft" type="button" data-act="later">${t('saveNotNow')}</button>
        ${isUpdate ? '' : `<button class="btn btn-link" type="button" data-act="never">${t('saveNever')}</button>`}
      </div>
    </div>
    <div class="fuse"><i style="animation-duration:${SAVE_TIMEOUT_MS}ms"></i></div>
  `
  const name = isUpdate && offer.title ? offer.title : offer.domain
  saveEl.querySelector('.lead').textContent =
    mode === 'link'
      ? t('linkLead').replace('{name}', name).replace('{site}', offer.domain)
      : mode === 'update'
        ? t('updateLead').replace('{name}', name)
        : t('saveLead')
  saveEl.querySelector('.tile').textContent = initialOf(name)
  saveEl.querySelector('.t1').textContent = name
  saveEl.querySelector('.t2').textContent = offer.login || t('noLogin')

  const node = saveEl
  node.querySelector('.fuse i').addEventListener('animationend', () => {
    if (saveEl === node) {
      api.runtime.sendMessage({ cmd: 'dismissSave' }).catch(() => {})
      closeSave()
    }
  })
  node.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('button[data-act]')
    if (!btn) return
    const act = btn.dataset.act
    if (act === 'later') {
      api.runtime.sendMessage({ cmd: 'dismissSave' }).catch(() => {})
      closeSave()
      return
    }
    if (act === 'never') {
      api.runtime.sendMessage({ cmd: 'neverSave', domain: offer.domain }).catch(() => {})
      closeSave()
      return
    }
    node.querySelectorAll('button').forEach((b) => (b.disabled = true))
    btn.textContent = t('saving')
    let res
    try {
      res = await api.runtime.sendMessage({ cmd: 'confirmSave' })
    } catch {
      res = { ok: false }
    }
    const actions = node.querySelector('.rp-actions')
    const fuse = node.querySelector('.fuse')
    if (fuse) fuse.remove()
    if (res && res.ok) {
      queryCache = null
      actions.outerHTML = `<div class="rp-msg ok">${icon('check')}<span>${copy.done}</span></div>`
      setTimeout(() => saveEl === node && closeSave(), 1800)
    } else {
      const reason = res && res.reason === 'locked' ? t('saveErrLocked') : t('saveErr')
      actions.outerHTML = `<div class="rp-msg err">${icon('alert')}<span>${reason}</span></div>`
      setTimeout(() => saveEl === node && closeSave(), 3500)
    }
  })
  mount(saveEl)
}

let scanTimer = null
function scheduleScan() {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(scan, 400)
}

let rafPending = false
function reposition() {
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    positionIcon()
    positionPanel()
  })
}

new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true
})

window.addEventListener('scroll', reposition, true)
window.addEventListener('resize', () => {
  iconOffset = null
  reposition()
})

document.addEventListener('mousedown', (e) => {
  if (panelEl && host && !e.composedPath().includes(host)) hidePanel()
})

document.addEventListener('submit', captureLoginAttempt, true)
document.addEventListener(
  'click',
  (e) => {
    if (e.composedPath().includes(host)) return
    const btn =
      e.target &&
      e.target.closest &&
      e.target.closest('button, input[type="submit"], [role="button"]')
    if (btn && isSubmitLike(btn)) captureLoginAttempt()
  },
  true
)
document.addEventListener(
  'keydown',
  (e) => {
    const target = e.target
    if (e.key !== 'Enter' || !target || target.tagName !== 'INPUT') return
    if (panelEl && panelItems.length) return
    if (target.type === 'password') captureLoginAttempt()
    else if (isUsernameLike(target) && !visiblePasswords().length) rememberLogin(target.value)
  },
  true
)

async function initAutoSubmit() {
  try {
    const data = await api.storage.local.get('appAutoSubmit')
    autoSubmit = !!data.appAutoSubmit
  } catch {
    void 0
  }
}

api.runtime.onMessage.addListener((msg) => {
  if (!msg) return
  if (msg.cmd === 'doFill' && msg.secret) fillFields(msg.secret)
  if (msg.type === 'locale') {
    rpSetLocale(msg.locale)
    if (panelEl) togglePanel(true)
  }
  if (msg.type === 'autosubmit') autoSubmit = !!msg.value
  if (msg.cmd === 'offerSave') showSave(msg)
  if (msg.cmd === 'saveDone') closeSave()
})

async function pullPendingOffer() {
  try {
    const offer = await api.runtime.sendMessage({ cmd: 'pendingOffer' })
    if (offer && offer.cmd === 'offerSave') showSave(offer)
  } catch {
    void 0
  }
}

rpInitI18n().then(pullPendingOffer)
initAutoSubmit()
scan()
