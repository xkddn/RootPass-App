import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

/**
 * @param {{ value: string | number, onChange: (v: string | number) => void, options: Array<{ value: string | number, label: string }>, className?: string }} props
 */
function CustomSelect({ value, onChange, options, className = '', icon: Icon = null, variant = 'default' }) {
  const pill = variant === 'pill'
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)
  const current = options.find((o) => String(o.value) === String(value)) || options[0]

  useEffect(() => {
    if (!open) return
    const handleOutside = (e) => {
      if (!containerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleScroll = () => setOpen(false)
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    setOpen((v) => !v)
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          pill
            ? 'flex min-h-10 w-full items-center justify-between gap-3 rounded-full bg-(--hd-card) px-4 text-[13px] font-semibold text-(--hd-ink) shadow-(--hd-shadow-card) transition-colors hover:text-(--hd-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hd-accent)'
            : `flex w-full items-center justify-between gap-3 rounded-full border border-(--hd-line) bg-(--hd-shell) px-4 py-2.5 text-[13px] text-(--hd-ink) transition-all hover:border-(--hd-faint) hover:bg-(--hd-line) ${FOCUS_RING}`
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className={`size-3.5 shrink-0 ${pill ? 'text-(--hd-mute)' : 'text-(--hd-mute)'}`} aria-hidden="true" />}
          <span className="truncate">{current?.label}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-(--hd-mute) transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className={
              pill
                ? 'hd fixed z-[9999] overflow-hidden rounded-2xl border border-(--hd-line) bg-(--hd-card) p-1.5 shadow-(--hd-shadow-pop)'
                : 'fixed z-[9999] overflow-hidden rounded-xl border border-(--hd-line) bg-(--hd-card) py-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150'
            }
          >
            {options.map(({ value: optVal, label }) => {
              const isSelected = String(value) === String(optVal)
              return (
                <button
                  key={String(optVal)}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onChange(optVal)
                    setOpen(false)
                  }}
                  className={
                    pill
                      ? `flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-(--hd-shell) focus-visible:outline-2 focus-visible:outline-(--hd-accent) ${isSelected ? 'text-(--hd-accent)' : 'text-(--hd-ink)'}`
                      : `flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-(--hd-shell) ${FOCUS_RING} ${isSelected ? 'text-(--hd-accent)' : 'text-(--hd-ink2)'}`
                  }
                >
                  <span className="flex-1 text-left">{label}</span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-(--hd-accent)" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}

export default CustomSelect
