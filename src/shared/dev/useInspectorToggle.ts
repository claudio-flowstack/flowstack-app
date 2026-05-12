import { useEffect, useState } from 'react'

const STORAGE_KEY = 'flowstack:dev:inspector'

export function useInspectorToggle(): boolean {
  const [active, setActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')
      if (!isToggle) return
      e.preventDefault()
      setActive((prev) => {
        const next = !prev
        try {
          localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
        } catch {
          /* ignore */
        }
        return next
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return active
}
