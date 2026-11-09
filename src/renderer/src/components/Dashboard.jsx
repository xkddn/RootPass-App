import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownUp,
  Download,
  Menu,
  Moon,
  Plus,
  Puzzle,
  Search,
  SearchX,
  Sun,
  X
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import AddAccountModal from './AddAccountModal'
import EditAccountModal from './EditAccountModal'
import ImportModal from './ImportModal'
import Settings from './Settings'
import NotificationCenter from './NotificationCenter'
import Help from './Help'
import ConfirmDialog from './ConfirmDialog'
import SecurityAuditPanel from './SecurityAuditPanel'
import Sidebar from './home/Sidebar'
import DetailCard from './home/DetailCard'
import { AccountRow, TableHeader } from './home/AccountTable'
import { ClipboardPill, HealthCard, ProtectionCard, CLIPBOARD_MS } from './home/SideCards'
import {
  computeWeakAccounts,
  computeDuplicateGroups,
  computeTwinGroups,
  computeTotalIssues
} from '../utils/auditHelpers'
import { setTheme, useThemeMode } from '../theme'
import useEscape from '../utils/useEscape'

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const SORT_OPTIONS = ['az', 'za', 'recent', 'oldest', 'updated']

const SORT_COMPARATORS = {
  az: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  za: (a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }),
  recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  updated: (a, b) =>
    new Date(b.passwordUpdatedAt || b.createdAt) - new Date(a.passwordUpdatedAt || a.createdAt)
}

function Dashboard({ onLogout }) {
  const { t, i18n } = useTranslation()
  const themeMode = useThemeMode()
  const [activeView, setActiveView] = useState('vault')
  const [settingsTab, setSettingsTab] = useState('language')
  const [accounts, setAccounts] = useState([])
  const [folders, setFolders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem('rootpass-sort')
    return SORT_OPTIONS.includes(saved) ? saved : 'az'
  })
  const [selectedNavId, setSelectedNavId] = useState('all')
  const [selectedNavType, setSelectedNavType] = useState('smart')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [clipUntil, setClipUntil] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null)
  const [autoLockTime, setAutoLockTime] = useState(15)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef(null)
  const searchRef = useRef(null)
  const [extBridgeStatus, setExtBridgeStatus] = useState(null)

  useEffect(() => {
    window.api.getBridgeStatus?.().then((s) => s && setExtBridgeStatus(s))
    const unsub = window.api.onBridgeStatus?.((s) => setExtBridgeStatus(s))
    return () => unsub?.()
  }, [])

  const fetchAccounts = async () => {
    try {
      const data = await window.api.getAllAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Erreur de récupération :', error)
    }
  }

  const fetchFolders = async () => {
    try {
      const data = await window.api.getFolders()
      setFolders(data)
    } catch (error) {
      console.error('Erreur récupération dossiers :', error)
    }
  }

  const handleDeleteFolder = async () => {
    await window.api.deleteFolder(confirmDeleteFolderId)
    setConfirmDeleteFolderId(null)
    if (selectedNavId === confirmDeleteFolderId) {
      setSelectedNavId('all')
      setSelectedNavType('smart')
    }
    fetchFolders()
    fetchAccounts()
  }

  useEffect(() => {
    window.api.getAutoLock().then(setAutoLockTime)
  }, [])

  useEffect(() => {
    window.api
      .getAllAccounts()
      .then((data) => setAccounts(data))
      .catch((err) => console.error('Erreur de récupération :', err))
    fetchFolders()
  }, [])

  useEffect(() => {
    const cleanup = window.api.onOpenAddAccount?.(() => setIsAddModalOpen(true))
    return cleanup
  }, [])

  useEffect(() => {
    const cleanup = window.api.onAccountsChanged?.(() => fetchAccounts())
    return cleanup
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setDrawerOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    drawerRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKey)
  }, [drawerOpen])

  useEffect(() => {
    setDrawerOpen(false)
  }, [selectedNavId, selectedNavType, activeView])

  useEscape(() => setSelectedAccountId(null), selectedAccountId != null)

  useEffect(() => {
    const handleSearchShortcut = (e) => {
      const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]')
      const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
      const isSlash = e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey
      if (isCtrlK || isSlash) {
        e.preventDefault()
        if (activeView !== 'vault') setActiveView('vault')
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleSearchShortcut)
    return () => window.removeEventListener('keydown', handleSearchShortcut)
  }, [activeView])

  useEffect(() => {
    const cleanups = []

    if (window.api?.onSystemLock) {
      cleanups.push(window.api.onSystemLock(() => onLogout()))
    }

    if (autoLockTime !== 0) {
      let timeoutId
      const resetTimer = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(
          () => {
            onLogout()
          },
          autoLockTime * 60 * 1000
        )
      }

      resetTimer()

      const events = ['mousemove', 'keydown', 'click', 'scroll']
      events.forEach((e) => window.addEventListener(e, resetTimer))

      cleanups.push(() => {
        clearTimeout(timeoutId)
        events.forEach((e) => window.removeEventListener(e, resetTimer))
      })
    }

    return () => cleanups.forEach((c) => c?.())
  }, [autoLockTime, onLogout])

  const allTags = [...new Set(accounts.flatMap((a) => a.tags || []))].sort()

  const handleDelete = (id) => setConfirmDeleteId(id)

  const doDelete = async () => {
    await window.api.deleteAccount(confirmDeleteId)
    setConfirmDeleteId(null)
    fetchAccounts()
  }

  const handleToggleFavorite = async (id, currentStatus) => {
    await window.api.toggleFavorite(id, currentStatus)
    fetchAccounts()
  }

  const handleCopy = (text, id) => {
    window.api.copyToClipboard(text)
    setCopiedId(id)
    setClipUntil(Date.now() + CLIPBOARD_MS)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const reusedPasswords = new Set(
    Object.entries(
      accounts.reduce((map, a) => {
        if (a.password) map[a.password] = (map[a.password] || 0) + 1
        return map
      }, {})
    )
      .filter(([, n]) => n > 1)
      .map(([pw]) => pw)
  )

  const weakAccounts = computeWeakAccounts(accounts)
  const duplicateGroups = computeDuplicateGroups(accounts)
  const twinGroups = computeTwinGroups(accounts)
  const weakIds = new Set(weakAccounts.map((a) => a.id))

  const getNavCount = (item) => {
    if (item.id === 'all') return accounts.length
    if (item.id === 'favorites') return accounts.filter((a) => !!a.is_favorite).length
    if (item.id === 'notes') return accounts.filter((a) => a.entry_type === 'note').length
    if (item.id === 'recent')
      return accounts.filter((a) => {
        const d = new Date(a.created_at)
        return !isNaN(d.getTime()) && d >= SEVEN_DAYS_AGO
      }).length
    if (item.id === 'weak')
      return weakAccounts.length
    if (item.id === 'reused')
      return accounts.filter((a) => !!a.password && reusedPasswords.has(a.password)).length
    if (item.id === 'noUrl')
      return accounts.filter((a) => a.entry_type !== 'note' && !a.url).length
    if (item.filterType === 'tag') return accounts.filter((a) => (a.tags || []).includes(item.id)).length
    if (item.filterType === 'customFolder') return accounts.filter((a) => a.folder_id === item.id).length
    return accounts.filter((a) => a.category === item.id).length
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || null

  const filteredAccounts = accounts
    .filter((acc) => {
      const matchesSearch =
        acc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.login.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesNav
      if (selectedNavType === 'tag') {
        matchesNav = (acc.tags || []).includes(selectedNavId)
      } else if (selectedNavType === 'customFolder') {
        matchesNav = acc.folder_id === selectedNavId
      } else if (selectedNavType === 'folder') {
        matchesNav = acc.category === selectedNavId
      } else {
        switch (selectedNavId) {
          case 'all':
            matchesNav = true
            break
          case 'favorites':
            matchesNav = !!acc.is_favorite
            break
          case 'notes':
            matchesNav = acc.entry_type === 'note'
            break
          case 'recent': {
            const d = new Date(acc.created_at)
            matchesNav = !isNaN(d.getTime()) && d >= SEVEN_DAYS_AGO
            break
          }
          case 'weak':
            matchesNav = weakIds.has(acc.id)
            break
          case 'reused':
            matchesNav = !!acc.password && reusedPasswords.has(acc.password)
            break
          case 'noUrl':
            matchesNav = acc.entry_type !== 'note' && !acc.url
            break
          default:
            matchesNav = true
        }
      }

      return matchesSearch && matchesNav
    })
    .sort(SORT_COMPARATORS[sortBy] || SORT_COMPARATORS.az)

  const selectNav = (id, type) => {
    setSelectedNavId(id)
    setSelectedNavType(type)
    setActiveView('vault')
  }

  const auditBadge = computeTotalIssues(weakAccounts, duplicateGroups, twinGroups)

  const healthCounts = {
    weak: weakAccounts.length,
    reused: duplicateGroups.reduce((s, g) => s + g.length, 0),
    twins: twinGroups.reduce((s, g) => s + g.accounts.length, 0),
    total: auditBadge
  }

  const weekCount = accounts.filter((a) => new Date(a.createdAt) >= SEVEN_DAYS_AGO).length

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const formatDate = (iso) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : dateFmt.format(d)
  }

  const tabbableId = filteredAccounts.some((a) => a.id === selectedAccountId)
    ? selectedAccountId
    : filteredAccounts[0]?.id

  const handleListKeyDown = (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return
    const rows = [...e.currentTarget.querySelectorAll('[data-row-main]')]
    const i = rows.indexOf(document.activeElement)
    if (i < 0) return
    const go = (n) => {
      e.preventDefault()
      rows[Math.max(0, Math.min(rows.length - 1, n))]?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'j') go(i + 1)
    else if (e.key === 'ArrowUp' || e.key === 'k') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(rows.length - 1)
    else if (e.key === 'Escape') setSelectedAccountId(null)
  }

  const toggleTheme = () => setTheme(themeMode === 'light' ? 'dark' : 'light')

  const iconBtn = 'hd-icon-btn'

  return (
    <div className="hd relative flex h-screen overflow-hidden bg-(--hd-bg) p-2 font-sans text-(--hd-ink) sm:p-3 lg:p-5">
      {isMobile && drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#000]/50"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative flex min-w-0 flex-1 overflow-hidden rounded-[28px] bg-(--hd-shell) shadow-(--hd-shadow-shell) lg:rounded-[36px]">
        <Sidebar
          accounts={accounts}
          folders={folders}
          setFolders={setFolders}
          fetchFolders={fetchFolders}
          allTags={allTags}
          selectedNavId={selectedNavId}
          selectedNavType={selectedNavType}
          activeView={activeView}
          auditBadge={auditBadge}
          getNavCount={getNavCount}
          onSelectNav={selectNav}
          onSetView={setActiveView}
          onOpenSettings={() => {
            setSettingsTab('language')
            setActiveView('settings')
          }}
          onLogout={onLogout}
          onRequestDeleteFolder={setConfirmDeleteFolderId}
          isMobile={isMobile}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          drawerRef={drawerRef}
        />

        <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden pb-2 pr-2 sm:pb-3 sm:pr-3 lg:pb-5 lg:pr-5">
          <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-6 pt-5 lg:px-5 lg:pb-8 lg:pt-10">
            {isMobile && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label={t('nav.openMenu')}
                aria-expanded={drawerOpen}
                className={iconBtn}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0 flex-1 basis-56">
              <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-(--hd-ink) lg:text-[34px]">
                {activeView === 'settings'
                  ? t('settings.title')
                  : activeView === 'help'
                    ? t('help.title')
                    : activeView === 'audit'
                      ? t('dashboard.securityAudit')
                      : t('home.title')}
              </h1>
              {activeView === 'vault' && (
                <p className="text-[15px] text-(--hd-mute)">
                  {t('home.subtitle', { count: accounts.length })}
                </p>
              )}
            </div>

            <div className="flex w-full min-w-0 items-center gap-2.5 sm:ml-auto sm:w-auto sm:shrink-0">
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <label htmlFor="hd-search" className="sr-only">
                  {t('dashboard.searchPlaceholder')}
                </label>
                <input
                  id="hd-search"
                  ref={searchRef}
                  type="search"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (activeView !== 'vault') setActiveView('vault')
                  }}
                  className="h-11 w-full rounded-full bg-(--hd-card) pl-5 pr-12 md:pr-24 text-[14px] font-semibold text-(--hd-ink) shadow-(--hd-shadow-card) outline-none ring-1 ring-transparent transition-shadow placeholder:font-semibold placeholder:text-(--hd-mute) focus:ring-2 focus:ring-(--hd-accent) sm:w-56 xl:w-72 [&::-webkit-search-cancel-button]:hidden"
                />
                <kbd className="pointer-events-none absolute right-12 top-1/2 hidden -translate-y-1/2 select-none rounded-md bg-(--hd-shell) px-1.5 py-0.5 font-sans text-[11px] font-bold text-(--hd-mute) md:inline-block">
                  Ctrl K
                </kbd>
                <Search
                  className="pointer-events-none absolute right-4 top-1/2 size-[18px] -translate-y-1/2 text-(--hd-mute)"
                  aria-hidden="true"
                />
              </div>

              {extBridgeStatus?.enabled && (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab('extension')
                    setActiveView('settings')
                  }}
                  title={
                    extBridgeStatus.connected
                      ? t('settings.extStatusConnected')
                      : extBridgeStatus.paired
                        ? t('settings.extStatusPaired')
                        : t('settings.extStatusOffline')
                  }
                  aria-label={
                    extBridgeStatus.connected
                      ? t('settings.extStatusConnected')
                      : extBridgeStatus.paired
                        ? t('settings.extStatusPaired')
                        : t('settings.extStatusOffline')
                  }
                  className={`${iconBtn} relative`}
                >
                  <Puzzle className="size-5" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className={`absolute right-2 top-2 size-2 rounded-full ring-2 ring-(--hd-card) ${
                      extBridgeStatus.connected
                        ? 'bg-(--hd-good)'
                        : extBridgeStatus.paired
                          ? 'bg-(--hd-warn)'
                          : 'bg-(--hd-faint)'
                    }`}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={themeMode === 'light' ? t('home.toDark') : t('home.toLight')}
                title={themeMode === 'light' ? t('home.toDark') : t('home.toLight')}
                className={iconBtn}
              >
                {themeMode === 'light' ? (
                  <Moon className="size-5" aria-hidden="true" />
                ) : (
                  <Sun className="size-5" aria-hidden="true" />
                )}
              </button>
              <NotificationCenter accounts={accounts} onOpenAudit={() => setActiveView('audit')} />
            </div>
          </header>

          {activeView === 'settings' || activeView === 'help' || activeView === 'audit' ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-(--hd-panel) lg:rounded-[32px]">
              <div className="hd-scroll h-full overflow-y-auto">
                {activeView === 'settings' ? (
                  <Settings initialTab={settingsTab} />
                ) : activeView === 'help' ? (
                  <Help />
                ) : (
                  <SecurityAuditPanel accounts={accounts} onEditAccount={setEditingAccount} />
                )}
              </div>
            </div>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-(--hd-panel) lg:rounded-[32px]">
              <div className="hd-scroll h-full overflow-y-auto px-5 pb-28 pt-7 lg:px-12 lg:pt-12">
                <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-w-0 space-y-14">
                    <div className="px-1">
                      <p className="text-[14px] font-semibold text-(--hd-mute)">{t('home.accounts')}</p>
                      <p className="text-[56px] font-extrabold leading-none tracking-tight text-(--hd-ink) tabular-nums">
                        {accounts.length}
                      </p>
                      <p className="mt-1 text-[17px] font-semibold text-(--hd-mute)">
                        {weekCount > 0
                          ? t('home.thisWeek', { count: weekCount })
                          : t('home.noneThisWeek')}
                      </p>
                      <p className="mt-3 max-w-[30ch] text-[13px] leading-snug text-(--hd-mute)">
                        {t('home.statHint')}
                      </p>
                    </div>

                    <div className="grid items-start gap-6 md:grid-cols-2 xl:hidden">
                      <HealthCard
                        counts={healthCounts}
                        onFilter={(id) => selectNav(id, 'smart')}
                        onAudit={() => setActiveView('audit')}
                      />
                      <ProtectionCard autoLockTime={autoLockTime} />
                    </div>

                    <section aria-labelledby="hd-list-title">
                      <div className="mb-7 flex flex-wrap items-center gap-3">
                        <h2
                          id="hd-list-title"
                          className="mr-auto text-[22px] font-extrabold tracking-tight text-(--hd-ink)"
                        >
                          {t('home.listTitle')}
                        </h2>
                        <CustomSelect
                          variant="pill"
                          value={sortBy}
                          onChange={(val) => {
                            setSortBy(val)
                            localStorage.setItem('rootpass-sort', val)
                          }}
                          className="w-44 shrink-0"
                          icon={ArrowDownUp}
                          options={SORT_OPTIONS.map((id) => ({ value: id, label: t(`sort.${id}`) }))}
                        />
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="hd-pill hd-pill-soft min-h-10 bg-(--hd-card) shadow-(--hd-shadow-card)"
                        >
                          <Download className="size-4" aria-hidden="true" />
                          {t('home.importAction')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="hd-pill hd-pill-accent min-h-10 px-5"
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          {t('home.newAccount')}
                        </button>
                      </div>

                      {filteredAccounts.length === 0 ? (
                        <div className="hd-card flex flex-col items-center gap-4 px-6 py-14 text-center">
                          <span className="flex size-14 items-center justify-center rounded-full bg-(--hd-accent-soft) text-(--hd-accent)">
                            {searchQuery ? (
                              <SearchX className="size-6" aria-hidden="true" />
                            ) : (
                              <Plus className="size-6" aria-hidden="true" />
                            )}
                          </span>
                          <div>
                            <h3 className="text-[18px] font-extrabold text-(--hd-ink)">
                              {searchQuery ? t('dashboard.emptyNoResults') : t('home.emptyTitle')}
                            </h3>
                            <p className="mt-1 max-w-[40ch] text-[14px] text-(--hd-mute)">
                              {searchQuery
                                ? t('dashboard.emptyNoResultsHint', { query: searchQuery })
                                : t('home.emptyHint')}
                            </p>
                          </div>
                          {searchQuery ? (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="hd-pill hd-pill-soft"
                            >
                              <X className="size-4" aria-hidden="true" />
                              {t('home.clearSearch')}
                            </button>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="hd-pill hd-pill-accent min-h-10 px-5"
                              >
                                <Plus className="size-4" aria-hidden="true" />
                                {t('home.newAccount')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsImportModalOpen(true)}
                                className="hd-pill hd-pill-soft min-h-10"
                              >
                                <Download className="size-4" aria-hidden="true" />
                                {t('home.importAction')}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="@container">
                          <TableHeader />
                          <div
                            role="list"
                            aria-label={t('home.listTitle')}
                            onKeyDown={handleListKeyDown}
                            className="space-y-2"
                          >
                            {filteredAccounts.map((account) => {
                              const folder =
                                account.folder_id && folders.find((f) => f.id === account.folder_id)
                              const flags = []
                              if (weakIds.has(account.id)) flags.push({ key: 'weak', label: t('home.flagWeak') })
                              if (account.password && reusedPasswords.has(account.password))
                                flags.push({ key: 'reused', label: t('home.flagReused') })
                              return (
                                <AccountRow
                                  key={account.id}
                                  account={account}
                                  categoryLabel={t(`categories.${account.category || 'Autres'}`, {
                                    defaultValue: account.category || 'Autres'
                                  })}
                                  folderName={folder ? folder.name : ''}
                                  selected={selectedAccountId === account.id}
                                  tabbable={tabbableId === account.id}
                                  flags={flags}
                                  dateLabel={formatDate(account.passwordUpdatedAt || account.createdAt)}
                                  copiedId={copiedId}
                                  onSelect={setSelectedAccountId}
                                  onCopy={handleCopy}
                                  onToggleFavorite={handleToggleFavorite}
                                  onEdit={setEditingAccount}
                                  onDelete={handleDelete}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  </div>

                  {selectedAccount && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label={t('home.details')}
                      className="rp-overlay-in fixed inset-0 z-40 flex items-end justify-center bg-(--hd-scrim) p-3 backdrop-blur-sm sm:items-center sm:p-6 xl:hidden"
                      onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setSelectedAccountId(null)
                      }}
                    >
                      <div
                        ref={(node) => node && node.offsetParent && node.focus({ preventScroll: true })}
                        tabIndex={-1}
                        className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col outline-none sm:max-h-[calc(100dvh-48px)]"
                      >
                        <DetailCard
                          account={selectedAccount}
                          folders={folders}
                          categoryLabel={t(`categories.${selectedAccount.category || 'Autres'}`, {
                            defaultValue: selectedAccount.category || 'Autres'
                          })}
                          copiedId={copiedId}
                          onCopy={handleCopy}
                          onToggleFavorite={handleToggleFavorite}
                          onEdit={setEditingAccount}
                          onDelete={handleDelete}
                          onClose={() => setSelectedAccountId(null)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="hidden min-w-0 xl:block">
                    <div className="sticky top-0 space-y-8">
                      {selectedAccount ? (
                        <div className="flex max-h-[calc(100vh-290px)] flex-col">
                          <DetailCard
                            account={selectedAccount}
                            folders={folders}
                            categoryLabel={t(`categories.${selectedAccount.category || 'Autres'}`, {
                              defaultValue: selectedAccount.category || 'Autres'
                            })}
                            copiedId={copiedId}
                            onCopy={handleCopy}
                            onToggleFavorite={handleToggleFavorite}
                            onEdit={setEditingAccount}
                            onDelete={handleDelete}
                            onClose={() => setSelectedAccountId(null)}
                          />
                        </div>
                      ) : (
                        <>
                          <HealthCard
                            counts={healthCounts}
                            onFilter={(id) => selectNav(id, 'smart')}
                            onAudit={() => setActiveView('audit')}
                          />
                          <ProtectionCard autoLockTime={autoLockTime} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <ClipboardPill until={clipUntil} onDone={() => setClipUntil(null)} />
            </div>
          )}
        </main>
      </div>

      {isAddModalOpen && (
        <AddAccountModal
          folders={folders}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchAccounts}
        />
      )}
      {isImportModalOpen && (
        <ImportModal onClose={() => setIsImportModalOpen(false)} onSuccess={fetchAccounts} />
      )}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          folders={folders}
          onClose={() => setEditingAccount(null)}
          onSuccess={fetchAccounts}
          onDelete={handleDelete}
        />
      )}
      {confirmDeleteId !== null && (
        <ConfirmDialog
          title={t('dashboard.confirmDelete')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={doDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {confirmDeleteFolderId !== null && (
        <ConfirmDialog
          title={t('nav.confirmDeleteFolder')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={handleDeleteFolder}
          onCancel={() => setConfirmDeleteFolderId(null)}
        />
      )}
    </div>
  )
}

export default Dashboard
