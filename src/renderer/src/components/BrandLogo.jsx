import { getBrandIcon, isDarkHex, hexToRgba, hueFromString } from '../utils/brandIcon'

/** @param {{ title?: string, size?: 'sm' | 'md' }} props */
function BrandLogo({ title, size = 'md' }) {
  const box = size === 'sm' ? 'size-9' : 'size-10'
  const glyph = size === 'sm' ? 'size-4' : 'size-5'
  const icon = getBrandIcon(title)

  if (icon) {
    const dark = isDarkHex(icon.hex)
    const fill = dark ? '#ffffff' : `#${icon.hex}`
    const bg = dark ? 'rgba(255,255,255,0.07)' : hexToRgba(icon.hex, 0.14)
    return (
      <div
        className={`flex ${box} shrink-0 items-center justify-center rounded-xl`}
        style={{ backgroundColor: bg }}
      >
        <svg role="img" viewBox="0 0 24 24" className={glyph} style={{ fill }}>
          <path d={icon.path} />
        </svg>
      </div>
    )
  }

  const letter = (title || '?').trim().charAt(0).toUpperCase() || '?'
  const hue = hueFromString(title)
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl text-sm font-bold`}
      style={{
        backgroundColor: `hsl(${hue} 45% 55% / 0.15)`,
        color: `hsl(${hue} 60% 70%)`
      }}
    >
      {letter}
    </div>
  )
}

export default BrandLogo
