/** @param {{ className?: string }} props */
function RootpassMark({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rp-mark-grad"
          x1="40"
          y1="30"
          x2="210"
          y2="232"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#46ECB0" />
          <stop offset="1" stopColor="#0F9A63" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#rp-mark-grad)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M128 22 L219.8 75 L219.8 181 L128 234 L36.2 181 L36.2 75 Z" strokeWidth="13" />
        <path d="M128 54 L154 69 L154 99 L128 114 L102 99 L102 69 Z" strokeWidth="9.5" />
        <line x1="128" y1="116" x2="128" y2="206" strokeWidth="14" />
        <line x1="128" y1="165" x2="148" y2="165" strokeWidth="11" />
        <line x1="128" y1="188" x2="148" y2="188" strokeWidth="11" />
      </g>
      <circle cx="128" cy="84" r="8" fill="url(#rp-mark-grad)" />
    </svg>
  )
}

export default RootpassMark
