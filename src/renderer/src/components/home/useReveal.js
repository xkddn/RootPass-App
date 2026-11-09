import { useCallback, useEffect, useState } from 'react'

export const REVEAL_MS = 8000

export function useReveal(resetKey) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [resetKey])

  useEffect(() => {
    if (!revealed) return
    const id = setTimeout(() => setRevealed(false), REVEAL_MS)
    return () => clearTimeout(id)
  }, [revealed])

  const toggle = useCallback(() => setRevealed((v) => !v), [])
  return [revealed, toggle]
}
