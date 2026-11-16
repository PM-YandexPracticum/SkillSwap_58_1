import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  enabled: boolean
  itemsCount: number
  onLoadMore?: () => void
}

export function useInfiniteScroll({ enabled, itemsCount, onLoadMore }: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !enabled || !onLoadMore) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore()
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, itemsCount, onLoadMore])

  return sentinelRef
}
