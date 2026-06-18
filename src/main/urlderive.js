import { extractDomain } from './autofill.js'

const URL_FIELD_ALIASES = [
  'url',
  'uri',
  'urls',
  'uris',
  'login_uri',
  'loginUri',
  'website',
  'web',
  'site',
  'link',
  'hostname',
  'host',
  'domain'
]

const KNOWN_SERVICES = {
  github: 'github.com',
  gitlab: 'gitlab.com',
  bitbucket: 'bitbucket.org',
  google: 'google.com',
  gmail: 'google.com',
  youtube: 'youtube.com',
  gdrive: 'drive.google.com',
  googledrive: 'drive.google.com',
  outlook: 'outlook.com',
  hotmail: 'outlook.com',
  microsoft: 'microsoft.com',
  office: 'office.com',
  office365: 'office.com',
  onedrive: 'onedrive.live.com',
  apple: 'apple.com',
  icloud: 'icloud.com',
  amazon: 'amazon.com',
  aws: 'aws.amazon.com',
  netflix: 'netflix.com',
  disney: 'disneyplus.com',
  disneyplus: 'disneyplus.com',
  spotify: 'spotify.com',
  deezer: 'deezer.com',
  twitch: 'twitch.tv',
  steam: 'steampowered.com',
  epicgames: 'epicgames.com',
  playstation: 'playstation.com',
  xbox: 'xbox.com',
  nintendo: 'nintendo.com',
  facebook: 'facebook.com',
  meta: 'facebook.com',
  messenger: 'messenger.com',
  instagram: 'instagram.com',
  whatsapp: 'whatsapp.com',
  twitter: 'twitter.com',
  x: 'x.com',
  linkedin: 'linkedin.com',
  reddit: 'reddit.com',
  pinterest: 'pinterest.com',
  tiktok: 'tiktok.com',
  snapchat: 'snapchat.com',
  discord: 'discord.com',
  slack: 'slack.com',
  telegram: 'telegram.org',
  signal: 'signal.org',
  zoom: 'zoom.us',
  teams: 'teams.microsoft.com',
  notion: 'notion.so',
  trello: 'trello.com',
  asana: 'asana.com',
  figma: 'figma.com',
  canva: 'canva.com',
  dropbox: 'dropbox.com',
  paypal: 'paypal.com',
  stripe: 'stripe.com',
  wise: 'wise.com',
  revolut: 'revolut.com',
  coinbase: 'coinbase.com',
  binance: 'binance.com',
  ebay: 'ebay.com',
  aliexpress: 'aliexpress.com',
  cdiscount: 'cdiscount.com',
  fnac: 'fnac.com',
  leboncoin: 'leboncoin.fr',
  airbnb: 'airbnb.com',
  booking: 'booking.com',
  uber: 'uber.com',
  airfrance: 'airfrance.fr',
  sncf: 'sncf-connect.com',
  orange: 'orange.fr',
  sfr: 'sfr.fr',
  free: 'free.fr',
  bouygues: 'bouyguestelecom.fr',
  wordpress: 'wordpress.com',
  wikipedia: 'wikipedia.org',
  twitch_tv: 'twitch.tv',
  protonmail: 'proton.me',
  proton: 'proton.me'
}

function normalizeName(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function pickSourceUrl(acc) {
  if (!acc || typeof acc !== 'object') return ''
  const pull = (item) =>
    typeof item === 'string' ? item : item && typeof item === 'object' ? item.uri || item.url || item.href : ''
  for (const key of URL_FIELD_ALIASES) {
    let v = acc[key]
    if (v == null) continue
    if (Array.isArray(v)) {
      v = v.map(pull).find((s) => typeof s === 'string' && s.trim())
    } else {
      v = pull(v)
    }
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

export function deriveDomainFromTitle(title) {
  if (!title) return ''
  const raw = String(title).trim()
  if (!raw) return ''

  const m = raw.match(/([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}/i)
  if (m) {
    const d = extractDomain(m[0])
    if (d) return d
  }

  const full = normalizeName(raw)
  if (KNOWN_SERVICES[full]) return KNOWN_SERVICES[full]
  const firstWord = normalizeName(raw.split(/[\s\-_|/]+/)[0])
  if (firstWord && KNOWN_SERVICES[firstWord]) return KNOWN_SERVICES[firstWord]

  return ''
}

export function resolveImportUrl(acc) {
  const real = pickSourceUrl(acc)
  if (real) return real
  return deriveDomainFromTitle(acc?.title)
}
