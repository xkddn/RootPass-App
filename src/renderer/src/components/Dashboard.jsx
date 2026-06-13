import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Plus,
  Key,
  Star,
  Copy,
  LogOut,
  Check,
  LayoutGrid,
  User,
  Briefcase,
  Landmark,
  AtSign,
  Folder,
  FolderOpen,
  FolderPlus,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Tv,
  BookOpen,
  Code2,
  Download,
  Settings as SettingsIcon,
  LifeBuoy,
  Trash2,
  Pencil,
  GripVertical,
  X
} from 'lucide-react'
import { tagColor } from './TagInput'
import TotpBadge from './TotpBadge'
import AddAccountModal from './AddAccountModal'
import EditAccountModal from './EditAccountModal'
import ImportModal from './ImportModal'
import BrandLogo from './BrandLogo'
import rootpassMark from '../assets/rootpass-mark.svg'
import Settings from './Settings'
import NotificationCenter from './NotificationCenter'
import Help from './Help'
import ConfirmDialog from './ConfirmDialog'
import SecurityAuditPanel from './SecurityAuditPanel'

const CATEGORY_META = {
  All: { icon: LayoutGrid, dot: 'bg-zinc-500' },
  Personnel: { icon: User, dot: 'bg-emerald-400' },
  Travail: { icon: Briefcase, dot: 'bg-sky-400' },
  Finance: { icon: Landmark, dot: 'bg-amber-400' },
  'Réseaux Sociaux': { icon: AtSign, dot: 'bg-violet-400' },
  Divertissement: { icon: Tv, dot: 'bg-fuchsia-400' },
  Education: { icon: BookOpen, dot: 'bg-cyan-400' },
  Développement: { icon: Code2, dot: 'bg-lime-400' },
  Autres: { icon: Folder, dot: 'bg-zinc-500' }
}

const NAV_SMART_ITEMS = [
  { id: 'all', labelKey: 'nav.all', icon: LayoutGrid, filterType: 'smart' },
  { id: 'favorites', labelKey: 'nav.favorites', icon: Star, filterType: 'smart' },
  { id: 'recent', labelKey: 'nav.recent', icon: Clock, filterType: 'smart' },
  { id: 'weak', labelKey: 'nav.weak', icon: ShieldAlert, filterType: 'smart' },
  { id: 'reused', labelKey: 'nav.reused', icon: Copy, filterType: 'smart' }
]

const DEFAULT_CATEGORY_FOLDERS = [
  { id: 'Personnel', icon: User, filterType: 'folder' },
  { id: 'Travail', icon: Briefcase, filterType: 'folder' },
  { id: 'Finance', icon: Landmark, filterType: 'folder' },
  { id: 'Réseaux Sociaux', icon: AtSign, filterType: 'folder' },
  { id: 'Divertissement', icon: Tv, filterType: 'folder' },
  { id: 'Education', icon: BookOpen, filterType: 'folder' },
  { id: 'Développement', icon: Code2, filterType: 'folder' },
  { id: 'Autres', icon: Folder, filterType: 'folder' }
]

const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORY_FOLDERS.map((f) => f.id)
const CATEGORY_FOLDER_MAP = Object.fromEntries(DEFAULT_CATEGORY_FOLDERS.map((f) => [f.id, f]))

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

const truncateSmart = (str, max = 22) => {
  if (!str || str.length <= max) return str
  const at = str.indexOf('@')
  if (at > 0) {
    const domain = str.slice(at)
    if (domain.length <= max - 2) {
      return str.slice(0, max - domain.length - 1) + '…' + domain
    }
  }
  return str.slice(0, max - 1) + '…'
}

function Dashboard({ onLogout }) {
  const { t } = useTranslation()
  const [activeView, setActiveView] = useState('vault')
  const [settingsTab, setSettingsTab] = useState('language')
  const [accounts, setAccounts] = useState([])
  const [folders, setFolders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNavId, setSelectedNavId] = useState('all')
  const [selectedNavType, setSelectedNavType] = useState('smart')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null)
  const [autoLockTime, setAutoLockTime] = useState(15)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [draggedFolderId, setDraggedFolderId] = useState(null)
  const [dragOverFolderId, setDragOverFolderId] = useState(null)
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rootpass-category-order') || 'null')
      if (Array.isArray(saved) && saved.every((id) => DEFAULT_CATEGORY_IDS.includes(id)) && saved.length === DEFAULT_CATEGORY_IDS.length) return saved
    } catch {}
    return DEFAULT_CATEGORY_IDS
  })
  const [draggedCatId, setDraggedCatId] = useState(null)
  const [dragOverCatId, setDragOverCatId] = useState(null)

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

  const handleAddFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    await window.api.addFolder(name)
    setNewFolderName('')
    setAddingFolder(false)
    fetchFolders()
  }

  const handleConfirmRenameFolder = async (id) => {
    const name = editingFolderName.trim()
    if (!name) { setEditingFolderId(null); return }
    await window.api.updateFolder(id, name)
    setEditingFolderId(null)
    fetchFolders()
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

  const handleCategoryDrop = (draggedId, targetId) => {
    if (draggedId === targetId) return
    const dragIdx = categoryOrder.indexOf(draggedId)
    const targetIdx = categoryOrder.indexOf(targetId)
    if (dragIdx === -1 || targetIdx === -1) return
    const reordered = [...categoryOrder]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setCategoryOrder(reordered)
    localStorage.setItem('rootpass-category-order', JSON.stringify(reordered))
  }

  const handleFolderDrop = async (draggedId, targetId) => {
    if (draggedId === targetId) return
    const dragIdx = folders.findIndex((f) => f.id === draggedId)
    const targetIdx = folders.findIndex((f) => f.id === targetId)
    if (dragIdx === -1 || targetIdx === -1) return
    const reordered = [...folders]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setFolders(reordered)
    await window.api.reorderFolders(reordered.map((f) => f.id))
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
    const handleResize = () => setSidebarCollapsed(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const getNavCount = (item) => {
    if (item.id === 'all') return accounts.length
    if (item.id === 'favorites') return accounts.filter((a) => !!a.is_favorite).length
    if (item.id === 'recent')
      return accounts.filter((a) => {
        const d = new Date(a.created_at)
        return !isNaN(d.getTime()) && d >= SEVEN_DAYS_AGO
      }).length
    if (item.id === 'weak') return accounts.filter((a) => (a.password?.length ?? 0) < 8).length
    if (item.id === 'reused')
      return accounts.filter((a) => !!a.password && reusedPasswords.has(a.password)).length
    if (item.filterType === 'tag') return accounts.filter((a) => (a.tags || []).includes(item.id)).length
    if (item.filterType === 'customFolder') return accounts.filter((a) => a.folder_id === item.id).length
    return accounts.filter((a) => a.category === item.id).length
  }

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
          case 'recent': {
            const d = new Date(acc.created_at)
            matchesNav = !isNaN(d.getTime()) && d >= SEVEN_DAYS_AGO
            break
          }
          case 'weak':
            matchesNav = (acc.password?.length ?? 0) < 8
            break
          case 'reused':
            matchesNav = !!acc.password && reusedPasswords.has(acc.password)
            break
          default:
            matchesNav = true
        }
      }

      return matchesSearch && matchesNav
    })
    .sort(
      (a, b) =>
        (b.is_favorite || 0) - (a.is_favorite || 0) ||
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )

  const hasCustomFields = filteredAccounts.some((a) => a.custom_fields?.length > 0)
  const hasUrl = filteredAccounts.some((a) => a.url)
  const hasTotp = filteredAccounts.some((a) => a.totp_secret)

  return (
    <div
      className="relative flex h-screen overflow-hidden bg-(--app-bg) font-sans text-zinc-300 selection:bg-emerald-500/30"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <div className="pointer-events-none absolute -left-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-emerald-500/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 size-72 rounded-full bg-sky-500/[0.04] blur-[100px]" />

      <aside
        className={`relative z-10 flex shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.012] transition-all duration-200 ${sidebarCollapsed ? 'w-14' : 'w-56'}`}
        role="navigation"
        aria-label={t('dashboard.categories')}
      >
        <div
          className={`flex items-center gap-3 py-6 ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-lg shadow-black/20">
            <img src={rootpassMark} className="size-5" alt="RootPass" />
          </div>
          {!sidebarCollapsed && (
            <span className="truncate text-[15px] font-bold tracking-tight text-white">
              RootPass
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {!sidebarCollapsed && (
            <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
              {t('nav.sectionViews')}
            </p>
          )}
          <ul className="space-y-px" role="list">
            {NAV_SMART_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = selectedNavId === item.id && activeView === 'vault'
              const count = getNavCount(item)
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setSelectedNavId(item.id)
                      setSelectedNavType(item.filterType)
                      setActiveView('vault')
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarCollapsed ? t(item.labelKey) : undefined}
                    className={`group flex w-full items-center rounded-xl text-[13px] font-medium transition-all duration-150 ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} ${
                      isActive
                        ? 'bg-emerald-500/[0.12] text-emerald-400 ring-1 ring-inset ring-emerald-500/[0.18]'
                        : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                    }`}
                  >
                    <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} aria-hidden="true" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{t(item.labelKey)}</span>
                        <span className={`shrink-0 text-[11px] tabular-nums ${isActive ? 'text-emerald-500/60' : 'text-zinc-700'}`} aria-hidden="true">{count}</span>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {!sidebarCollapsed && (
            <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
              {t('nav.sectionFolders')}
            </p>
          )}
          <ul className="space-y-px" role="list">
            {categoryOrder.map((catId) => {
              const item = CATEGORY_FOLDER_MAP[catId]
              if (!item) return null
              const Icon = item.icon
              const isActive = selectedNavId === catId && activeView === 'vault'
              const count = getNavCount(item)
              const isDragOver = dragOverCatId === catId && draggedCatId !== catId
              return (
                <li
                  key={catId}
                  className="group/cat"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedCatId(catId) }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCatId(catId) }}
                  onDragLeave={() => setDragOverCatId(null)}
                  onDrop={(e) => { e.preventDefault(); handleCategoryDrop(draggedCatId, catId); setDraggedCatId(null); setDragOverCatId(null) }}
                  onDragEnd={() => { setDraggedCatId(null); setDragOverCatId(null) }}
                >
                  <div className={`flex items-center rounded-xl transition-all duration-150 ${isDragOver ? 'ring-1 ring-inset ring-emerald-500/40 bg-emerald-500/[0.06]' : isActive ? 'bg-emerald-500/[0.12] ring-1 ring-inset ring-emerald-500/[0.18]' : 'hover:bg-white/[0.04]'} ${draggedCatId === catId ? 'opacity-40' : ''}`}>
                    {!sidebarCollapsed && (
                      <span className="shrink-0 cursor-grab pl-1 text-zinc-800 opacity-0 transition-opacity group-hover/cat:opacity-100 active:cursor-grabbing">
                        <GripVertical className="size-3" aria-hidden="true" />
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedNavId(catId); setSelectedNavType('folder'); setActiveView('vault') }}
                      aria-current={isActive ? 'page' : undefined}
                      title={sidebarCollapsed ? t(`categories.${catId}`) : undefined}
                      className={`flex flex-1 min-w-0 items-center text-[13px] font-medium ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-2 py-2'} ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}
                    >
                      <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} aria-hidden="true" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left">{t(`categories.${catId}`)}</span>
                          <span className={`shrink-0 text-[11px] tabular-nums ${isActive ? 'text-emerald-500/60' : 'text-zinc-700'}`} aria-hidden="true">{count}</span>
                        </>
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {allTags.length > 0 && (
            <div className="mt-1">
              {!sidebarCollapsed && (
                <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                  {t('nav.sectionTags')}
                </p>
              )}
              <ul className="space-y-px" role="list">
                {allTags.map((tag) => {
                  const isActive = selectedNavId === tag && selectedNavType === 'tag' && activeView === 'vault'
                  const count = accounts.filter((a) => (a.tags || []).includes(tag)).length
                  return (
                    <li key={tag}>
                      <button
                        onClick={() => {
                          setSelectedNavId(tag)
                          setSelectedNavType('tag')
                          setActiveView('vault')
                        }}
                        title={sidebarCollapsed ? tag : undefined}
                        className={`group flex w-full items-center rounded-xl text-[13px] font-medium transition-all duration-150 ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} ${
                          isActive
                            ? 'bg-emerald-500/[0.12] text-emerald-400 ring-1 ring-inset ring-emerald-500/[0.18]'
                            : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                        }`}
                      >
                        <Tag className={`size-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} aria-hidden="true" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate text-left">{tag}</span>
                            <span className={`shrink-0 text-[11px] tabular-nums ${isActive ? 'text-emerald-500/60' : 'text-zinc-700'}`}>{count}</span>
                          </>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="mt-1">
            {!sidebarCollapsed && (
              <div className="mb-1 mt-2 flex items-center justify-between px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                  {t('nav.sectionCustomFolders')}
                </p>
                <button
                  onClick={() => { setAddingFolder(true); setNewFolderName('') }}
                  title={t('nav.addFolder')}
                  className={`rounded-md p-0.5 text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400 ${FOCUS_RING}`}
                >
                  <FolderPlus className="size-3" />
                </button>
              </div>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => { setAddingFolder(true); setNewFolderName('') }}
                title={t('nav.addFolder')}
                className={`flex w-full justify-center rounded-xl px-0 py-2 text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400 ${FOCUS_RING}`}
              >
                <FolderPlus className="size-3.5" />
              </button>
            )}
            <ul className="space-y-px" role="list">
              {folders.map((folder) => {
                const isActive = selectedNavId === folder.id && selectedNavType === 'customFolder' && activeView === 'vault'
                const count = accounts.filter((a) => a.folder_id === folder.id).length
                const isDragOver = dragOverFolderId === folder.id && draggedFolderId !== folder.id
                return (
                  <li
                    key={folder.id}
                    className="group/folder"
                    draggable={editingFolderId !== folder.id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggedFolderId(folder.id)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverFolderId(folder.id)
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleFolderDrop(draggedFolderId, folder.id)
                      setDraggedFolderId(null)
                      setDragOverFolderId(null)
                    }}
                    onDragEnd={() => {
                      setDraggedFolderId(null)
                      setDragOverFolderId(null)
                    }}
                  >
                    {editingFolderId === folder.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <input
                          autoFocus
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRenameFolder(folder.id)
                            if (e.key === 'Escape') setEditingFolderId(null)
                          }}
                          className="flex-1 min-w-0 rounded-lg border border-white/[0.1] bg-black/30 px-2 py-1 text-[12px] text-zinc-200 outline-none focus:border-emerald-500/40"
                        />
                        <button onClick={() => handleConfirmRenameFolder(folder.id)} className={`rounded-md p-0.5 text-emerald-500 hover:bg-emerald-500/10 ${FOCUS_RING}`}>
                          <Check className="size-3" />
                        </button>
                        <button onClick={() => setEditingFolderId(null)} className={`rounded-md p-0.5 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 ${FOCUS_RING}`}>
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center rounded-xl transition-all duration-150 ${isDragOver ? 'ring-1 ring-inset ring-emerald-500/40 bg-emerald-500/[0.06]' : isActive ? 'bg-emerald-500/[0.12] ring-1 ring-inset ring-emerald-500/[0.18]' : 'hover:bg-white/[0.04]'} ${draggedFolderId === folder.id ? 'opacity-40' : ''} ${sidebarCollapsed ? '' : 'pr-1'}`}>
                        {!sidebarCollapsed && (
                          <span className="shrink-0 cursor-grab pl-1 text-zinc-800 opacity-0 transition-opacity group-hover/folder:opacity-100 active:cursor-grabbing">
                            <GripVertical className="size-3" aria-hidden="true" />
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedNavId(folder.id)
                            setSelectedNavType('customFolder')
                            setActiveView('vault')
                          }}
                          title={sidebarCollapsed ? folder.name : undefined}
                          className={`flex flex-1 min-w-0 items-center text-[13px] font-medium ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-2 py-2'} ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}
                        >
                          <FolderOpen className={`size-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`} aria-hidden="true" />
                          {!sidebarCollapsed && (
                            <>
                              <span className="min-w-0 flex-1 truncate text-left">{folder.name}</span>
                              <span className={`shrink-0 text-[11px] tabular-nums ${isActive ? 'text-emerald-500/60' : 'text-zinc-700'}`}>{count}</span>
                            </>
                          )}
                        </button>
                        {!sidebarCollapsed && (
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/folder:opacity-100">
                            <button
                              onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name) }}
                              className={`rounded-md p-1 text-zinc-700 hover:bg-white/[0.06] hover:text-zinc-400 ${FOCUS_RING}`}
                            >
                              <Pencil className="size-2.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteFolderId(folder.id)}
                              className={`rounded-md p-1 text-zinc-700 hover:bg-red-500/10 hover:text-red-400 ${FOCUS_RING}`}
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
              {addingFolder && !sidebarCollapsed && (
                <li>
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      autoFocus
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddFolder()
                        if (e.key === 'Escape') setAddingFolder(false)
                      }}
                      placeholder={t('nav.folderPlaceholder')}
                      className="flex-1 min-w-0 rounded-lg border border-white/[0.1] bg-black/30 px-2 py-1 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-emerald-500/40"
                    />
                    <button onClick={handleAddFolder} className={`rounded-md p-0.5 text-emerald-500 hover:bg-emerald-500/10 ${FOCUS_RING}`}>
                      <Check className="size-3" />
                    </button>
                    <button onClick={() => setAddingFolder(false)} className={`rounded-md p-0.5 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 ${FOCUS_RING}`}>
                      <X className="size-3" />
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.08] p-2 pt-3">
          {!sidebarCollapsed && (
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
              {t('dashboard.sectionSystem')}
            </p>
          )}
          <div className="space-y-px">
            <button
              onClick={() => setActiveView('audit')}
              aria-current={activeView === 'audit' ? 'page' : undefined}
              title={sidebarCollapsed ? t('dashboard.securityAudit') : undefined}
              className={`flex w-full items-center rounded-xl text-[13px] font-medium transition-colors ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} ${
                activeView === 'audit'
                  ? 'bg-emerald-500/12 text-emerald-400 ring-1 ring-inset ring-emerald-500/18'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-400'
              }`}
            >
              <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && t('dashboard.securityAudit')}
            </button>
            <button
              onClick={() => {
                setSettingsTab('language')
                setActiveView('settings')
              }}
              aria-current={activeView === 'settings' ? 'page' : undefined}
              title={sidebarCollapsed ? t('settings.title') : undefined}
              className={`flex w-full items-center rounded-xl text-[13px] font-medium transition-colors ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} ${
                activeView === 'settings'
                  ? 'bg-white/[0.05] text-zinc-200'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-400'
              }`}
            >
              <SettingsIcon className="size-3.5" aria-hidden="true" />
              {!sidebarCollapsed && t('settings.title')}
            </button>
            <button
              onClick={() => setActiveView('help')}
              aria-current={activeView === 'help' ? 'page' : undefined}
              title={sidebarCollapsed ? t('help.title') : undefined}
              className={`flex w-full items-center rounded-xl text-[13px] font-medium transition-colors ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} ${
                activeView === 'help'
                  ? 'bg-white/[0.05] text-zinc-200'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-400'
              }`}
            >
              <LifeBuoy className="size-3.5" aria-hidden="true" />
              {!sidebarCollapsed && t('help.title')}
            </button>
          </div>
          <div className="mt-2 border-t border-white/[0.06] pt-2">
            <button
              onClick={onLogout}
              title={sidebarCollapsed ? t('dashboard.logout') : undefined}
              className={`flex w-full items-center rounded-xl text-[13px] font-medium text-zinc-500 transition-colors hover:bg-red-500/[0.08] hover:text-red-400 ${FOCUS_RING} ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'}`}
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              {!sidebarCollapsed && t('dashboard.logout')}
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex h-screen flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 select-none text-[10px] font-medium text-zinc-700">
          RootPass v{__APP_VERSION__} &middot; &copy; {new Date().getFullYear()} xkddn
        </div>
        {activeView === 'settings' ? (
          <Settings initialTab={settingsTab} />
        ) : activeView === 'help' ? (
          <Help />
        ) : activeView === 'audit' ? (
          <SecurityAuditPanel accounts={accounts} onEditAccount={setEditingAccount} />
        ) : (
          <>
            <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/[0.06] bg-white/[0.01] px-5 py-4 lg:px-8 lg:py-5">
              <div className="min-w-0 flex-1">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400/70">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {t('dashboard.securedAccounts', { count: filteredAccounts.length })}
                </p>
                <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">
                  {t('dashboard.vaultTitle')}
                </h1>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <NotificationCenter
                  accounts={accounts}
                  onOpenAutofill={() => {
                    setSettingsTab('autofill')
                    setActiveView('settings')
                  }}
                  onOpenAudit={() => setActiveView('audit')}
                />
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder={t('dashboard.searchPlaceholder')}
                    aria-label={t('dashboard.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 rounded-full border border-white/[0.07] bg-white/[0.02] py-2.5 pl-10 pr-4 text-[13px] text-zinc-300 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 md:w-52 lg:w-64"
                  />
                </div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  title={t('importModal.title')}
                  className={`flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[13px] font-medium text-zinc-500 transition-all hover:border-white/[0.12] hover:text-zinc-300 lg:px-4 ${FOCUS_RING}`}
                >
                  <Download className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">{t('importModal.title')}</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  title={t('dashboard.newElement')}
                  className={`flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2.5 text-[13px] font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-px hover:bg-emerald-400 md:px-5 ${FOCUS_RING}`}
                >
                  <Plus className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">{t('dashboard.newElement')}</span>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {filteredAccounts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <Key className="size-7 text-zinc-700" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-300">
                      {searchQuery ? t('dashboard.emptyNoResults') : t('dashboard.emptyNoAccounts')}
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-600">
                      {searchQuery
                        ? t('dashboard.emptyNoResultsHint', { query: searchQuery })
                        : t('dashboard.emptyNoAccountsHint')}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className={`flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 ${FOCUS_RING}`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {t('dashboard.addToVault')}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="@container overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.01]"
                  role="list"
                  aria-label={t('dashboard.vaultTitle')}
                >
                  <div
                    aria-hidden="true"
                    className="flex items-center gap-5 border-b border-white/[0.06] bg-white/[0.015] px-4 py-2"
                  >
                    <div className="size-9 shrink-0" />
                    <div className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                      {t('dashboard.colName')}
                    </div>
                    <div className="hidden @3xl:block flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                      {t('dashboard.colCategory')}
                    </div>
                    <div className="hidden @xl:block flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                      {t('dashboard.colLogin')}
                    </div>
                    {hasUrl && (
                      <div className="hidden @5xl:block flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                        {t('dashboard.colUrl')}
                      </div>
                    )}
                    {hasCustomFields && (
                      <div className="hidden @6xl:block flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                        {t('dashboard.colKeys')}
                      </div>
                    )}
                    {hasTotp && (
                      <div className="hidden @4xl:block flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                        {t('dashboard.col2fa')}
                      </div>
                    )}
                    <div className="w-[168px] shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                      {t('dashboard.colActions')}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-2">
                    {filteredAccounts.map((account, index) => {
                      const meta = CATEGORY_META[account.category] || CATEGORY_META.Autres
                      return (
                        <div
                          key={account.id}
                          role="listitem"
                          className="group relative flex items-center gap-5 rounded-xl px-4 py-4 transition-colors duration-150 hover:bg-white/[0.03] animate-in fade-in slide-in-from-bottom-1 [animation-fill-mode:both] duration-200"
                          style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
                        >
                          <BrandLogo title={account.title} size="sm" />

                          <div className="flex-1 min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              {!!account.is_favorite && (
                                <Star
                                  className="size-3 shrink-0 fill-amber-400 text-amber-400"
                                  aria-hidden="true"
                                />
                              )}
                              <p className="truncate text-[13px] font-semibold text-white">
                                {account.title}
                              </p>
                            </div>
                            {account.tags?.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {account.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className={`inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium ${tagColor(tag)}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {account.tags.length > 3 && (
                                  <span className="text-[10px] text-zinc-700">
                                    +{account.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="hidden @3xl:flex flex-1 min-w-0 flex-col gap-1 overflow-hidden">
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] px-2.5 py-[3px] text-[11px] font-medium text-zinc-600">
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${meta.dot}`}
                                aria-hidden="true"
                              />
                              <span className="truncate">
                                {t(`categories.${account.category || 'Autres'}`)}
                              </span>
                            </span>
                            {account.folder_id && folders.find((f) => f.id === account.folder_id) && (
                              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/[0.05] bg-white/[0.02] px-2 py-[2px] text-[10px] font-medium text-zinc-700">
                                <FolderOpen className="size-2.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                  {folders.find((f) => f.id === account.folder_id)?.name}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="hidden @xl:block flex-1 min-w-0">
                            <p className="overflow-hidden whitespace-nowrap font-mono text-[13px] text-zinc-500">
                              {account.login ? truncateSmart(account.login) : '—'}
                            </p>
                          </div>

                          {hasUrl && (
                            <div className="hidden @5xl:block min-w-0 flex-1 overflow-hidden">
                              {account.url ? (
                                <button
                                  onClick={() => window.open(account.url)}
                                  className={`max-w-full overflow-hidden whitespace-nowrap text-left text-[12px] text-zinc-600 underline-offset-2 transition-colors hover:text-emerald-400 hover:underline ${FOCUS_RING}`}
                                  title={account.url}
                                >
                                  {truncateSmart(
                                    account.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                                  )}
                                </button>
                              ) : (
                                <span className="select-none text-[12px] text-zinc-800">—</span>
                              )}
                            </div>
                          )}

                          {hasCustomFields && (
                            <div className="hidden @6xl:block flex-1 min-w-0 overflow-hidden">
                              {account.custom_fields?.length > 0 ? (
                                <div className="flex flex-nowrap gap-1 overflow-hidden">
                                  {account.custom_fields.slice(0, 2).map((field, i) => {
                                    const cfId = `cf-${account.id}-${i}`
                                    const copied = copiedId === cfId
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => handleCopy(field.value, cfId)}
                                        title={field.value}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${FOCUS_RING} ${
                                          copied
                                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                                            : 'border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/15 hover:text-emerald-400'
                                        }`}
                                      >
                                        {copied ? (
                                          <Check className="size-2.5 shrink-0" />
                                        ) : (
                                          <Copy className="size-2.5 shrink-0 opacity-50" />
                                        )}
                                        {field.label}
                                      </button>
                                    )
                                  })}
                                  {account.custom_fields.length > 2 && (
                                    <span className="text-[10px] text-zinc-700">
                                      +{account.custom_fields.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="select-none text-[12px] text-zinc-800">—</span>
                              )}
                            </div>
                          )}

                          {hasTotp && (
                            <div className="hidden @4xl:block flex-1 min-w-0 overflow-hidden">
                              {account.totp_secret ? (
                                <TotpBadge
                                  secret={account.totp_secret}
                                  onCopy={handleCopy}
                                  copiedId={copiedId}
                                  copyId={`totp-${account.id}`}
                                />
                              ) : (
                                <span className="select-none text-[12px] text-zinc-800">—</span>
                              )}
                            </div>
                          )}

                          <div className="w-[168px] shrink-0" aria-hidden="true" />

                          <div className="absolute inset-y-2 right-2 z-10 flex items-center justify-end gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-950/95 px-2.5 opacity-0 shadow-xl shadow-black/50 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                            <button
                              onClick={() => handleCopy(account.login, `login-${account.id}`)}
                              aria-label={`${t('dashboard.copyUser')} — ${account.title}`}
                              title={t('dashboard.copyUser')}
                              className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-all ${FOCUS_RING} ${
                                copiedId === `login-${account.id}`
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                  : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200'
                              }`}
                            >
                              {copiedId === `login-${account.id}` ? (
                                <Check className="size-3" aria-hidden="true" />
                              ) : (
                                <Copy className="size-3" aria-hidden="true" />
                              )}
                              Login
                            </button>
                            <button
                              onClick={() => handleCopy(account.password, account.id)}
                              aria-label={`${t('dashboard.copyPass')} — ${account.title}`}
                              title={t('dashboard.copyPass')}
                              className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all ${FOCUS_RING} ${
                                copiedId === account.id
                                  ? 'bg-emerald-400 text-zinc-950'
                                  : 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25 hover:bg-emerald-400'
                              }`}
                            >
                              {copiedId === account.id ? (
                                <Check className="size-3" aria-hidden="true" />
                              ) : (
                                <Copy className="size-3" aria-hidden="true" />
                              )}
                              ****
                            </button>
                            <div
                              className="mx-0.5 h-4 w-px shrink-0 bg-white/[0.08]"
                              aria-hidden="true"
                            />
                            <button
                              onClick={() => handleToggleFavorite(account.id, account.is_favorite)}
                              aria-label={
                                account.is_favorite
                                  ? t('dashboard.removeFromFavorites')
                                  : t('dashboard.addToFavorites')
                              }
                              aria-pressed={!!account.is_favorite}
                              title={
                                account.is_favorite
                                  ? t('dashboard.removeFromFavorites')
                                  : t('dashboard.addToFavorites')
                              }
                              className={`rounded-lg p-1.5 transition-colors ${FOCUS_RING} ${
                                account.is_favorite
                                  ? 'text-amber-400 hover:bg-amber-400/10'
                                  : 'text-zinc-700 hover:bg-white/[0.05] hover:text-amber-400'
                              }`}
                            >
                              <Star
                                className="size-3.5"
                                fill={account.is_favorite ? 'currentColor' : 'none'}
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              onClick={() => setEditingAccount(account)}
                              aria-label={`${t('dashboard.edit')} — ${account.title}`}
                              title={t('common.edit')}
                              className={`rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 ${FOCUS_RING}`}
                            >
                              <Pencil className="size-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              aria-label={`${t('accountForm.deleteAccount')} — ${account.title}`}
                              title={t('common.delete')}
                              className={`rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-red-500/10 hover:text-red-400 ${FOCUS_RING}`}
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

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
