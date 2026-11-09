import { useEffect, useRef } from 'react'

const stack = []

function handleKeyDown(e) {
  if (e.key !== 'Escape' || e.defaultPrevented || !stack.length) return
  e.preventDefault()
  stack[stack.length - 1].current()
}

export default function useEscape(handler, enabled = true) {
  const ref = useRef(handler)

  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    if (!stack.length) window.addEventListener('keydown', handleKeyDown)
    stack.push(ref)
    return () => {
      const index = stack.lastIndexOf(ref)
      if (index !== -1) stack.splice(index, 1)
      if (!stack.length) window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])
}
