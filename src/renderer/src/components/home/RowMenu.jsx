import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

function RowMenu({
  label,
  items,
  tabIndex = 0,
  icon: TriggerIcon = MoreHorizontal,
  align = 'right',
  buttonClassName = 'flex size-9 shrink-0 items-center justify-center rounded-full text-(--hd-mute) transition-colors hover:bg-(--hd-shell) hover:text-(--hd-ink)'
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    menuRef.current?.querySelector('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggle = (e) => {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right, left: rect.left })
    }
    setOpen((v) => !v)
  }

  const onMenuKey = (e) => {
    const nodes = [...menuRef.current.querySelectorAll('[role="menuitem"]')]
    const i = nodes.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      nodes[(i + 1) % nodes.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        tabIndex={tabIndex}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClassName}
      >
        <TriggerIcon className="size-[18px]" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={align === 'left' ? { top: pos.top, left: pos.left } : { top: pos.top, right: pos.right }}
            className="hd hd-scroll fixed z-[9999] max-h-80 min-w-56 overflow-y-auto rounded-2xl border border-(--hd-line) bg-(--hd-card) p-1.5 shadow-(--hd-shadow-pop)"
          >
            {items.map(({ key, label: itemLabel, icon: Icon, onSelect, danger, heading, note, trailing }) =>
              heading || note ? (
                <p
                  key={key}
                  className={heading ? 'hd-label px-3 pb-1 pt-3' : 'px-3 py-2.5 text-[13px] text-(--hd-mute)'}
                >
                  {itemLabel}
                </p>
              ) : (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  onSelect()
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors hover:bg-(--hd-shell) focus:bg-(--hd-shell) focus:outline-none ${
                  danger ? 'text-(--hd-bad)' : 'text-(--hd-ink)'
                }`}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
                {trailing !== undefined && (
                  <span className="text-[12px] font-bold text-(--hd-mute) tabular-nums">{trailing}</span>
                )}
              </button>
              )
            )}
          </div>,
          document.body
        )}
    </>
  )
}

export default RowMenu
