import { useCallback, useEffect, useState, type RefObject } from 'react'

type ScrollProgress = {
  progress: number
  scrollable: boolean
}

function getWindowProgress(): ScrollProgress {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  if (maxScroll <= 0) return { progress: 0, scrollable: false }
  return { progress: (window.scrollY / maxScroll) * 100, scrollable: true }
}

function getElementProgress(el: HTMLElement): ScrollProgress {
  const maxScroll = el.scrollHeight - el.clientHeight
  if (maxScroll <= 0) return { progress: 0, scrollable: false }
  return { progress: (el.scrollTop / maxScroll) * 100, scrollable: true }
}

export function useWindowScrollProgress(enabled = true) {
  const [state, setState] = useState<ScrollProgress>({ progress: 0, scrollable: false })

  const update = useCallback(() => {
    setState(getWindowProgress())
  }, [])

  useEffect(() => {
    if (!enabled) return
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [enabled, update])

  return state
}

export function useElementScrollProgress(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<ScrollProgress>({ progress: 0, scrollable: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setState(getElementProgress(el))
  }, [ref])

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when content length changes
  }, [enabled, ref, update, ...deps])

  return { ...state, resetScroll: () => { if (ref.current) ref.current.scrollTop = 0 } }
}
