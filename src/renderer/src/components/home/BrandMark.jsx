import { useId } from 'react'

function BrandMark({ className = 'size-9' }) {
  const id = useId()
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a78c0" />
          <stop offset="1" stopColor="#2a46d6" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill={`url(#${id})`} />
      <circle cx="64" cy="36" r="9" fill="#ffffff" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M64 52V94" />
        <path d="M64 66C64 80 44 80 36 96" />
        <path d="M64 66C64 80 84 80 92 96" />
      </g>
    </svg>
  )
}

export default BrandMark
