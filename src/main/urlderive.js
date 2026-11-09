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
  // Google
  google: 'google.com',
  gmail: 'mail.google.com',
  googlemail: 'mail.google.com',
  youtube: 'youtube.com',
  youtubemusic: 'music.youtube.com',
  gdrive: 'drive.google.com',
  googledrive: 'drive.google.com',
  googlephotos: 'photos.google.com',
  googleplay: 'play.google.com',
  playstore: 'play.google.com',
  googlecloud: 'cloud.google.com',
  gcp: 'cloud.google.com',
  firebase: 'firebase.google.com',
  googleads: 'ads.google.com',
  adsense: 'adsense.google.com',
  googleanalytics: 'analytics.google.com',
  googlemaps: 'maps.google.com',
  meet: 'meet.google.com',
  // Microsoft
  microsoft: 'microsoft.com',
  outlook: 'outlook.com',
  hotmail: 'outlook.com',
  live: 'live.com',
  msn: 'msn.com',
  office: 'office.com',
  office365: 'office.com',
  microsoft365: 'office.com',
  onedrive: 'onedrive.live.com',
  teams: 'teams.microsoft.com',
  azure: 'portal.azure.com',
  skype: 'skype.com',
  bing: 'bing.com',
  copilot: 'copilot.microsoft.com',
  // Apple
  apple: 'apple.com',
  appleid: 'appleid.apple.com',
  icloud: 'icloud.com',
  itunes: 'apple.com',
  appstore: 'apple.com',
  applemusic: 'music.apple.com',
  appletv: 'tv.apple.com',
  // Amazon
  amazon: 'amazon.com',
  amazonfr: 'amazon.fr',
  aws: 'aws.amazon.com',
  audible: 'audible.com',
  kindle: 'amazon.com',
  primevideo: 'primevideo.com',
  amazonprime: 'primevideo.com',
  // Social
  facebook: 'facebook.com',
  meta: 'facebook.com',
  messenger: 'messenger.com',
  instagram: 'instagram.com',
  insta: 'instagram.com',
  whatsapp: 'whatsapp.com',
  twitter: 'x.com',
  x: 'x.com',
  threads: 'threads.net',
  linkedin: 'linkedin.com',
  reddit: 'reddit.com',
  pinterest: 'pinterest.com',
  tiktok: 'tiktok.com',
  snapchat: 'snapchat.com',
  snap: 'snapchat.com',
  tumblr: 'tumblr.com',
  mastodon: 'mastodon.social',
  bluesky: 'bsky.app',
  bsky: 'bsky.app',
  vk: 'vk.com',
  onlyfans: 'onlyfans.com',
  bereal: 'bere.al',
  // Communication
  discord: 'discord.com',
  slack: 'slack.com',
  telegram: 'telegram.org',
  signal: 'signal.org',
  zoom: 'zoom.us',
  webex: 'webex.com',
  whereby: 'whereby.com',
  // Streaming / media
  netflix: 'netflix.com',
  disney: 'disneyplus.com',
  disneyplus: 'disneyplus.com',
  canal: 'canalplus.com',
  canalplus: 'canalplus.com',
  mycanal: 'canalplus.com',
  molotov: 'molotov.tv',
  spotify: 'spotify.com',
  deezer: 'deezer.com',
  applemusicsvc: 'music.apple.com',
  soundcloud: 'soundcloud.com',
  twitch: 'twitch.tv',
  dailymotion: 'dailymotion.com',
  crunchyroll: 'crunchyroll.com',
  adn: 'animationdigitalnetwork.fr',
  ocs: 'ocs.fr',
  paramountplus: 'paramountplus.com',
  paramount: 'paramountplus.com',
  hbomax: 'max.com',
  max: 'max.com',
  plex: 'plex.tv',
  // Gaming
  steam: 'steampowered.com',
  epicgames: 'epicgames.com',
  epic: 'epicgames.com',
  gog: 'gog.com',
  ubisoft: 'ubisoft.com',
  uplay: 'ubisoft.com',
  ea: 'ea.com',
  origin: 'ea.com',
  playstation: 'playstation.com',
  psn: 'playstation.com',
  xbox: 'xbox.com',
  nintendo: 'nintendo.com',
  riotgames: 'riotgames.com',
  riot: 'riotgames.com',
  leagueoflegends: 'leagueoflegends.com',
  battlenet: 'battle.net',
  blizzard: 'battle.net',
  rockstar: 'rockstargames.com',
  rockstargames: 'rockstargames.com',
  roblox: 'roblox.com',
  minecraft: 'minecraft.net',
  // Tech / dev
  github: 'github.com',
  gitlab: 'gitlab.com',
  bitbucket: 'bitbucket.org',
  stackoverflow: 'stackoverflow.com',
  npm: 'npmjs.com',
  docker: 'docker.com',
  dockerhub: 'hub.docker.com',
  vercel: 'vercel.com',
  netlify: 'netlify.com',
  heroku: 'heroku.com',
  digitalocean: 'digitalocean.com',
  cloudflare: 'cloudflare.com',
  ovh: 'ovh.com',
  ovhcloud: 'ovh.com',
  gandi: 'gandi.net',
  hostinger: 'hostinger.com',
  namecheap: 'namecheap.com',
  godaddy: 'godaddy.com',
  jetbrains: 'jetbrains.com',
  atlassian: 'atlassian.com',
  jira: 'atlassian.com',
  confluence: 'atlassian.com',
  raspberrypi: 'raspberrypi.com',
  // AI
  openai: 'openai.com',
  chatgpt: 'chatgpt.com',
  anthropic: 'anthropic.com',
  claude: 'claude.ai',
  midjourney: 'midjourney.com',
  huggingface: 'huggingface.co',
  perplexity: 'perplexity.ai',
  gemini: 'gemini.google.com',
  mistral: 'mistral.ai',
  // Productivity / cloud
  notion: 'notion.so',
  trello: 'trello.com',
  asana: 'asana.com',
  monday: 'monday.com',
  clickup: 'clickup.com',
  todoist: 'todoist.com',
  evernote: 'evernote.com',
  obsidian: 'obsidian.md',
  miro: 'miro.com',
  airtable: 'airtable.com',
  calendly: 'calendly.com',
  dropbox: 'dropbox.com',
  box: 'box.com',
  mega: 'mega.nz',
  wetransfer: 'wetransfer.com',
  // Design
  figma: 'figma.com',
  canva: 'canva.com',
  adobe: 'adobe.com',
  behance: 'behance.net',
  dribbble: 'dribbble.com',
  sketch: 'sketch.com',
  framer: 'framer.com',
  // Email providers
  protonmail: 'proton.me',
  proton: 'proton.me',
  tutanota: 'tuta.com',
  tuta: 'tuta.com',
  yahoo: 'yahoo.com',
  yahoomail: 'yahoo.com',
  gmx: 'gmx.com',
  zoho: 'zoho.com',
  fastmail: 'fastmail.com',
  mailo: 'mailo.com',
  yandex: 'yandex.com',
  aol: 'aol.com',
  // Finance / crypto
  paypal: 'paypal.com',
  stripe: 'stripe.com',
  wise: 'wise.com',
  revolut: 'revolut.com',
  n26: 'n26.com',
  qonto: 'qonto.com',
  lydia: 'lydia-app.com',
  coinbase: 'coinbase.com',
  binance: 'binance.com',
  kraken: 'kraken.com',
  kucoin: 'kucoin.com',
  metamask: 'metamask.io',
  ledger: 'ledger.com',
  bitpanda: 'bitpanda.com',
  etoro: 'etoro.com',
  tradingview: 'tradingview.com',
  traderepublic: 'traderepublic.com',
  degiro: 'degiro.fr',
  // Banques FR
  boursorama: 'boursorama.com',
  boursobank: 'boursobank.com',
  fortuneo: 'fortuneo.fr',
  hellobank: 'hellobank.fr',
  bnpparibas: 'mabanque.bnpparibas',
  bnp: 'mabanque.bnpparibas',
  creditagricole: 'credit-agricole.fr',
  lcl: 'lcl.fr',
  societegenerale: 'sg.fr',
  socgen: 'sg.fr',
  caissedepargne: 'caisse-epargne.fr',
  banquepopulaire: 'banquepopulaire.fr',
  creditmutuel: 'creditmutuel.fr',
  labanquepostale: 'labanquepostale.fr',
  banquepostale: 'labanquepostale.fr',
  monabanq: 'monabanq.com',
  nickel: 'nickel.eu',
  ing: 'ing.fr',
  // Assurances FR
  maif: 'maif.fr',
  macif: 'macif.fr',
  matmut: 'matmut.fr',
  maaf: 'maaf.fr',
  gmf: 'gmf.fr',
  groupama: 'groupama.fr',
  allianz: 'allianz.fr',
  axa: 'axa.fr',
  harmonie: 'harmonie-mutuelle.fr',
  // Admin / sante FR
  ameli: 'ameli.fr',
  impots: 'impots.gouv.fr',
  caf: 'caf.fr',
  poleemploi: 'francetravail.fr',
  francetravail: 'francetravail.fr',
  ants: 'ants.gouv.fr',
  servicepublic: 'service-public.fr',
  urssaf: 'urssaf.fr',
  doctolib: 'doctolib.fr',
  laposte: 'laposte.fr',
  chronopost: 'chronopost.fr',
  colissimo: 'laposte.fr',
  // Telco FR
  orange: 'orange.fr',
  sosh: 'sosh.fr',
  sfr: 'sfr.fr',
  redbysfr: 'red-by-sfr.fr',
  free: 'free.fr',
  freemobile: 'mobile.free.fr',
  bouygues: 'bouyguestelecom.fr',
  bouyguestelecom: 'bouyguestelecom.fr',
  // Energie FR
  edf: 'edf.fr',
  engie: 'engie.fr',
  totalenergies: 'totalenergies.fr',
  veolia: 'veolia.fr',
  // Retail FR + monde
  fnac: 'fnac.com',
  darty: 'darty.com',
  cdiscount: 'cdiscount.com',
  leboncoin: 'leboncoin.fr',
  vinted: 'vinted.fr',
  laredoute: 'laredoute.fr',
  zalando: 'zalando.fr',
  decathlon: 'decathlon.fr',
  ikea: 'ikea.com',
  leroymerlin: 'leroymerlin.fr',
  castorama: 'castorama.fr',
  carrefour: 'carrefour.fr',
  auchan: 'auchan.fr',
  leclerc: 'e.leclerc',
  intermarche: 'intermarche.com',
  monoprix: 'monoprix.fr',
  sephora: 'sephora.fr',
  veepee: 'veepee.com',
  shein: 'shein.com',
  asos: 'asos.com',
  zara: 'zara.com',
  uniqlo: 'uniqlo.com',
  ebay: 'ebay.com',
  aliexpress: 'aliexpress.com',
  alibaba: 'alibaba.com',
  temu: 'temu.com',
  wish: 'wish.com',
  etsy: 'etsy.com',
  rakuten: 'rakuten.com',
  backmarket: 'backmarket.fr',
  manomano: 'manomano.fr',
  // Transport / voyage
  sncf: 'sncf-connect.com',
  sncfconnect: 'sncf-connect.com',
  ouigo: 'ouigo.com',
  ratp: 'ratp.fr',
  blablacar: 'blablacar.fr',
  airfrance: 'airfrance.fr',
  flixbus: 'flixbus.fr',
  uber: 'uber.com',
  bolt: 'bolt.eu',
  booking: 'booking.com',
  airbnb: 'airbnb.com',
  expedia: 'expedia.fr',
  ryanair: 'ryanair.com',
  easyjet: 'easyjet.com',
  tripadvisor: 'tripadvisor.fr',
  // Apprentissage
  udemy: 'udemy.com',
  coursera: 'coursera.org',
  duolingo: 'duolingo.com',
  openclassrooms: 'openclassrooms.com',
  khanacademy: 'khanacademy.org',
  leetcode: 'leetcode.com',
  codingame: 'codingame.com',
  // Divers
  wikipedia: 'wikipedia.org',
  wordpress: 'wordpress.com',
  wix: 'wix.com',
  shopify: 'shopify.com',
  squarespace: 'squarespace.com',
  spotifyfr: 'spotify.com'
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

  const tokens = raw
    .split(/[\s\-_|/.,’'()[\]]+/)
    .map(normalizeName)
    .filter((tok) => tok.length >= 3)
  for (const tok of tokens) {
    if (KNOWN_SERVICES[tok]) return KNOWN_SERVICES[tok]
  }

  return ''
}

export function resolveImportUrl(acc) {
  const real = pickSourceUrl(acc)
  if (real) return real
  return deriveDomainFromTitle(acc?.title)
}
