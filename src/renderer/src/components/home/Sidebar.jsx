import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AtSign,
  BookOpen,
  Briefcase,
  Check,
  Clock,
  Code2,
  Copy,
  Folder,
  FolderOpen,
  FolderPlus,
  GripVertical,
  LayoutGrid,
  LifeBuoy,
  Landmark,
  LogOut,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  ShieldAlert,
  Star,
  StickyNote,
  Tag,
  Trash2,
  Tv,
  Unlink,
  User,
  X
} from 'lucide-react'
import BrandMark from './BrandMark'
import RowMenu from './RowMenu'

const SMART_VIEWS = [
  { id: 'favorites', labelKey: 'nav.favorites', icon: Star, type: 'smart' },
  { id: 'notes', labelKey: 'nav.notes', icon: StickyNote, type: 'smart' },
  { id: 'recent', labelKey: 'nav.recent', icon: Clock, type: 'smart' },
  { id: 'weak', labelKey: 'nav.weak', icon: ShieldAlert, type: 'smart' },
  { id: 'reused', labelKey: 'nav.reused', icon: Copy, type: 'smart' },
  { id: 'noUrl', labelKey: 'nav.noUrl', icon: Unlink, type: 'smart' }
]

const CATEGORY_VIEWS = [
  { id: 'Personnel', icon: User },
  { id: 'Travail', icon: Briefcase },
  { id: 'Finance', icon: Landmark },
  { id: 'Réseaux Sociaux', icon: AtSign },
  { id: 'Divertissement', icon: Tv },
  { id: 'Education', icon: BookOpen },
  { id: 'Développement', icon: Code2 },
  { id: 'Autres', icon: Folder }
].map((c) => ({ ...c, type: 'folder' }))

const PINNED_KEY = 'rootpass-pinned-views'
const DEFAULT_PINNED = ['smart:favorites']

const loadPinned = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PINNED_KEY) || 'null')
    if (Array.isArray(saved) && saved.every((k) => typeof k === 'string')) return saved
  } catch {
    return DEFAULT_PINNED
  }
  return DEFAULT_PINNED
}

const viewKey = (v) => `${v.type}:${v.id}`

function MainItem({ icon: Icon, label, active, badge, badgeLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-4 rounded-full px-5 py-3.5 text-left text-[15px] font-bold transition-all duration-150 ${
        active
          ? 'bg-(--hd-card) text-(--hd-ink) shadow-(--hd-shadow-lift)'
          : 'text-(--hd-ink2) hover:bg-(--hd-card-hover) hover:text-(--hd-ink)'
      }`}
    >
      <Icon
        className={`size-5 shrink-0 ${active ? 'text-(--hd-accent)' : 'text-(--hd-mute)'}`}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--hd-accent-soft) px-2 text-[12px] font-bold text-(--hd-accent) tabular-nums">
          {badge}
          <span className="sr-only"> {badgeLabel}</span>
        </span>
      )}
    </button>
  )
}

function SubItem({ icon: Icon, label, count, active, onClick, children }) {
  return (
    <div
      className={`group/sub flex items-center rounded-full transition-colors ${
        active
          ? 'bg-(--hd-card) shadow-(--hd-shadow-lift)'
          : 'hover:bg-(--hd-card-hover)'
      }`}
    >
      {children}
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`flex min-w-0 flex-1 items-center gap-3.5 rounded-full py-3 pl-5 pr-3 text-left text-[14px] font-semibold ${
          active ? 'text-(--hd-ink)' : 'text-(--hd-ink2) hover:text-(--hd-ink)'
        }`}
      >
        <Icon
          className={`size-4 shrink-0 ${active ? 'text-(--hd-accent)' : 'text-(--hd-mute)'}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span
          className="shrink-0 text-[12px] font-bold text-(--hd-mute) tabular-nums"
          aria-hidden="true"
        >
          {count}
        </span>
      </button>
    </div>
  )
}

function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 mt-10 flex items-center justify-between px-5">
      <p className="hd-label">{children}</p>
      {action}
    </div>
  )
}

function Sidebar({
  accounts,
  folders,
  setFolders,
  fetchFolders,
  allTags,
  selectedNavId,
  selectedNavType,
  activeView,
  auditBadge,
  getNavCount,
  onSelectNav,
  onSetView,
  onOpenSettings,
  onLogout,
  onRequestDeleteFolder,
  isMobile,
  drawerOpen,
  onCloseDrawer,
  drawerRef
}) {
  const { t } = useTranslation()
  const [pinned, setPinned] = useState(loadPinned)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [draggedFolderId, setDraggedFolderId] = useState(null)
  const [dragOverFolderId, setDragOverFolderId] = useState(null)

  const savePinned = (next) => {
    setPinned(next)
    localStorage.setItem(PINNED_KEY, JSON.stringify(next))
  }

  const tagViews = allTags.map((tag) => ({ id: tag, type: 'tag', icon: Tag, label: tag }))
  const catalog = [
    ...SMART_VIEWS.map((v) => ({ ...v, label: t(v.labelKey) })),
    ...CATEGORY_VIEWS.map((v) => ({ ...v, label: t(`categories.${v.id}`) })),
    ...tagViews
  ]
  const pinnedViews = pinned.map((k) => catalog.find((v) => viewKey(v) === k)).filter(Boolean)
  const available = catalog.filter((v) => !pinned.includes(viewKey(v)))

  const pin = (view) => savePinned([...pinned, viewKey(view)])
  const unpin = (view) => {
    savePinned(pinned.filter((k) => k !== viewKey(view)))
    if (selectedNavId === view.id && selectedNavType === view.type) onSelectNav('all', 'smart')
  }

  const addMenuItems = (() => {
    if (available.length === 0) return [{ key: 'none', note: true, label: t('home.noMoreViews') }]
    const groups = [
      ['smart', t('home.menuSmart')],
      ['folder', t('home.menuCategories')],
      ['tag', t('home.menuTags')]
    ]
    return groups.flatMap(([type, title]) => {
      const rows = available.filter((v) => v.type === type)
      if (rows.length === 0) return []
      return [
        { key: `h-${type}`, heading: true, label: title },
        ...rows.map((v) => ({
          key: viewKey(v),
          label: v.label,
          icon: v.icon,
          trailing: getNavCount({ id: v.id, filterType: v.type }),
          onSelect: () => pin(v)
        }))
      ]
    })
  })()

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
    if (!name) {
      setEditingFolderId(null)
      return
    }
    await window.api.updateFolder(id, name)
    setEditingFolderId(null)
    fetchFolders()
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

  const inVault = activeView === 'vault'
  const isAll = inVault && selectedNavId === 'all' && selectedNavType === 'smart'
  const gripClass =
    'shrink-0 cursor-grab pl-2 text-(--hd-faint) opacity-0 transition-opacity group-hover/sub:opacity-100 active:cursor-grabbing'
  const miniInput =
    'min-w-0 flex-1 rounded-full bg-(--hd-card) px-4 py-2.5 text-[13px] font-semibold text-(--hd-ink) outline-none ring-1 ring-(--hd-line) placeholder:text-(--hd-mute) focus:ring-2 focus:ring-(--hd-accent)'
  const miniBtn =
    'flex size-8 shrink-0 items-center justify-center rounded-full text-(--hd-ink2) transition-colors hover:bg-(--hd-card) hover:text-(--hd-ink)'
  const plusBtn =
    'flex size-8 items-center justify-center rounded-full text-(--hd-mute) transition-colors hover:bg-(--hd-card) hover:text-(--hd-ink)'

  return (
    <aside
      ref={drawerRef}
      tabIndex={isMobile ? -1 : undefined}
      {...(isMobile && !drawerOpen ? { inert: '' } : {})}
      role={isMobile ? 'dialog' : 'navigation'}
      aria-modal={isMobile && drawerOpen ? true : undefined}
      aria-label={t('dashboard.categories')}
      className={`flex shrink-0 flex-col outline-none ${
        isMobile
          ? `fixed inset-y-3 left-3 z-50 w-72 rounded-[28px] bg-(--hd-shell) shadow-(--hd-shadow-float) transition-transform duration-300 ${
              drawerOpen ? 'translate-x-0' : '-translate-x-[120%]'
            }`
          : 'relative z-10 w-[264px]'
      }`}
    >
      <div className="flex items-center gap-3.5 px-8 pb-8 pt-9">
        <BrandMark className="size-10 shrink-0" />
        <span className="truncate text-[22px] font-extrabold tracking-tight text-(--hd-ink)">
          RootPass
        </span>
        {isMobile && (
          <button
            type="button"
            onClick={onCloseDrawer}
            aria-label={t('nav.closeMenu')}
            className="ml-auto flex size-9 items-center justify-center rounded-full text-(--hd-mute) hover:bg-(--hd-card) hover:text-(--hd-ink)"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="hd-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <MainItem
            icon={LayoutGrid}
            label={t('home.vault')}
            active={isAll}
            onClick={() => onSelectNav('all', 'smart')}
          />
          <MainItem
            icon={ShieldAlert}
            label={t('dashboard.securityAudit')}
            active={activeView === 'audit'}
            badge={auditBadge}
            badgeLabel={t('audit.badgeSr')}
            onClick={() => onSetView('audit')}
          />
          <MainItem
            icon={SettingsIcon}
            label={t('settings.title')}
            active={activeView === 'settings'}
            onClick={onOpenSettings}
          />
          <MainItem
            icon={LifeBuoy}
            label={t('help.title')}
            active={activeView === 'help'}
            onClick={() => onSetView('help')}
          />
        </div>

        <SectionTitle
          action={
            <RowMenu
              label={t('home.addView')}
              icon={Plus}
              align="left"
              items={addMenuItems}
              buttonClassName={plusBtn}
            />
          }
        >
          {t('home.myViews')}
        </SectionTitle>
        {pinnedViews.length > 0 && (
          <ul className="space-y-1.5" role="list">
            {pinnedViews.map((view) => (
              <li key={viewKey(view)}>
                <SubItem
                  icon={view.icon}
                  label={view.label}
                  count={getNavCount({ id: view.id, filterType: view.type })}
                  active={inVault && selectedNavId === view.id && selectedNavType === view.type}
                  onClick={() => onSelectNav(view.id, view.type)}
                >
                  <button
                    type="button"
                    onClick={() => unpin(view)}
                    aria-label={`${t('home.unpin')} : ${view.label}`}
                    title={t('home.unpin')}
                    className="ml-1.5 hidden size-7 shrink-0 items-center justify-center rounded-full text-(--hd-mute) hover:bg-(--hd-shell) hover:text-(--hd-ink) group-hover/sub:flex group-focus-within/sub:flex"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </SubItem>
              </li>
            ))}
          </ul>
        )}

        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => {
                setAddingFolder(true)
                setNewFolderName('')
              }}
              aria-label={t('nav.addFolder')}
              title={t('nav.addFolder')}
              className={plusBtn}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
            </button>
          }
        >
          {t('nav.sectionCustomFolders')}
        </SectionTitle>
        <ul className="space-y-1.5" role="list">
          {folders.map((folder) => {
            const isActive =
              inVault && selectedNavId === folder.id && selectedNavType === 'customFolder'
            const count = accounts.filter((a) => a.folder_id === folder.id).length
            const isDragOver = dragOverFolderId === folder.id && draggedFolderId !== folder.id
            return (
              <li
                key={folder.id}
                draggable={editingFolderId !== folder.id}
                className={`${isDragOver ? 'rounded-full ring-2 ring-(--hd-accent)' : ''} ${draggedFolderId === folder.id ? 'opacity-40' : ''}`}
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
                  <div className="flex items-center gap-1 px-1 py-1">
                    <input
                      autoFocus
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRenameFolder(folder.id)
                        if (e.key === 'Escape') setEditingFolderId(null)
                      }}
                      aria-label={t('nav.folderPlaceholder')}
                      className={miniInput}
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmRenameFolder(folder.id)}
                      aria-label={t('common.confirm')}
                      className={`${miniBtn} text-(--hd-good)`}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFolderId(null)}
                      aria-label={t('common.cancel')}
                      className={miniBtn}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <SubItem
                    icon={FolderOpen}
                    label={folder.name}
                    count={count}
                    active={isActive}
                    onClick={() => onSelectNav(folder.id, 'customFolder')}
                  >
                    <span className={gripClass}>
                      <GripVertical className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="ml-1 hidden shrink-0 items-center group-hover/sub:flex group-focus-within/sub:flex">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFolderId(folder.id)
                          setEditingFolderName(folder.name)
                        }}
                        aria-label={`${t('common.edit')} : ${folder.name}`}
                        className="flex size-7 items-center justify-center rounded-full text-(--hd-mute) hover:bg-(--hd-shell) hover:text-(--hd-ink)"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteFolder(folder.id)}
                        aria-label={`${t('common.delete')} : ${folder.name}`}
                        className="flex size-7 items-center justify-center rounded-full text-(--hd-mute) hover:bg-(--hd-bad-soft) hover:text-(--hd-bad)"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </SubItem>
                )}
              </li>
            )
          })}
          {addingFolder && (
            <li>
              <div className="flex items-center gap-1 px-1 py-1">
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
                  aria-label={t('nav.folderPlaceholder')}
                  className={miniInput}
                />
                <button
                  type="button"
                  onClick={handleAddFolder}
                  aria-label={t('common.confirm')}
                  className={`${miniBtn} text-(--hd-good)`}
                >
                  <Check className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setAddingFolder(false)}
                  aria-label={t('common.cancel')}
                  className={miniBtn}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="shrink-0 px-4 pb-7 pt-3">
        <div className="flex items-center gap-3 rounded-full bg-(--hd-card) p-2.5 shadow-(--hd-shadow-card)">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--hd-good-soft)">
            <span className="size-2.5 rounded-full bg-(--hd-good)" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-extrabold leading-tight text-(--hd-ink)">
              {t('home.connected')}
            </p>
            <p className="truncate text-[12px] text-(--hd-mute)">AES-256</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('home.lock')}
            title={t('home.lock')}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--hd-shell) text-(--hd-ink2) transition-colors hover:bg-(--hd-bad-soft) hover:text-(--hd-bad)"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
