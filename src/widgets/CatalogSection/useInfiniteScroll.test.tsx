import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from '../../shared/hooks/useInfiniteScroll'

function InfiniteScrollTest({
  enabled,
  itemsCount,
  onLoadMore,
}: {
  enabled: boolean
  itemsCount: number
  onLoadMore?: () => void
}) {
  const sentinelRef = useInfiniteScroll({ enabled, itemsCount, onLoadMore })

  return <div ref={sentinelRef} data-testid="sentinel" />
}

describe('useInfiniteScroll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('запрашивает следующую порцию при пересечении sentinel с областью видимости', () => {
    const onLoadMore = vi.fn()

    class MockIntersectionObserver {
      constructor(private callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }

      disconnect = vi.fn()
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    render(<InfiniteScrollTest enabled itemsCount={3} onLoadMore={onLoadMore} />)

    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('не создаёт observer, если загрузка выключена', () => {
    const observe = vi.fn()

    class MockIntersectionObserver {
      constructor() {}
      observe = observe
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    render(<InfiniteScrollTest enabled={false} itemsCount={3} onLoadMore={() => {}} />)

    expect(observe).not.toHaveBeenCalled()
  })

  it('отключает observer при размонтировании', () => {
    const disconnect = vi.fn()

    class MockIntersectionObserver {
      constructor() {}
      observe() {}
      disconnect = disconnect
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    const { unmount } = render(<InfiniteScrollTest enabled itemsCount={3} onLoadMore={() => {}} />)

    unmount()

    expect(disconnect).toHaveBeenCalledOnce()
  })
})
