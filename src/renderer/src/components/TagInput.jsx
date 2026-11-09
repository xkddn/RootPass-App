import { useState } from 'react'
import { X } from 'lucide-react'

const TAG_COLORS = [
  'bg-(--hd-accent-soft) text-(--hd-accent) border-transparent',
  'bg-(--hd-shell) text-(--hd-ink2) border-transparent'
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
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-(--hd-line) bg-(--hd-shell) px-3 py-2 transition-all focus-within:border-(--hd-accent) focus-within:ring-2 focus-within:ring-(--hd-accent)/30">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium ${tagColor(tag)}`}
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
        className="min-w-[80px] flex-1 bg-transparent text-[13px] text-(--hd-ink) outline-none placeholder:text-(--hd-mute)"
      />
    </div>
  )
}

export default TagInput
