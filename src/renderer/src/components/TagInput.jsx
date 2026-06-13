import { useState } from 'react'
import { X } from 'lucide-react'

const TAG_COLORS = [
  'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'bg-sky-500/15 text-sky-400 border-sky-500/20',
  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'bg-rose-500/15 text-rose-400 border-rose-500/20',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20'
]

export function tagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) & 0xffff
  return TAG_COLORS[hash % TAG_COLORS.length]
}

function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = (val) => {
    const clean = val
      .trim()
      .toLowerCase()
      .replace(/[\s,]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    if (clean && !tags.includes(clean)) onChange([...tags, clean])
    setInput('')
  }

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input) addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2 transition-all focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/[0.12]">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tagColor(tag)}`}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full opacity-60 hover:opacity-100"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input) addTag(input)
        }}
        placeholder={tags.length === 0 ? (placeholder || '') : ''}
        className="min-w-[80px] flex-1 bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-700"
      />
    </div>
  )
}

export default TagInput
