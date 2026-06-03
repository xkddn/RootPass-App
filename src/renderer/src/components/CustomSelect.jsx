import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

/**
 * @param {{ value: string | number, onChange: (v: string | number) => void, options: Array<{ value: string | number, label: string }>, className?: string }} props
 */
function CustomSelect({ value, onChange, options, className = '' }) {
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
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-2.5 text-[13px] text-zinc-200 transition-all hover:border-white/[0.12] hover:bg-black/40 ${FOCUS_RING}`}
      >
        <span>{current?.label}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-zinc-600 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[9999] overflow-hidden rounded-xl border border-white/[0.07] bg-[#0C0C10] py-1 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-top-1 duration-150"
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
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/[0.04] ${FOCUS_RING} ${
                    isSelected ? 'text-emerald-400' : 'text-zinc-300'
                  }`}
                >
                  <span className="flex-1 text-left">{label}</span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
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
