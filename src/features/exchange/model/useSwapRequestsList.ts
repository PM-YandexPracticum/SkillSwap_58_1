import { useState, useEffect } from 'react'
import type { SwapRequestDetails } from '@/shared/types'
import type {
  SwapRequestRole,
  SwapRequestStatus,
} from '@/entities/request/model/api/swapRequestApi'
import { useGetSwapRequestsQuery } from '@/entities/request/model/api/swapRequestApi'

interface UseSwapRequestsListProps {
  role?: SwapRequestRole
  status: SwapRequestStatus
}

export function useSwapRequestsList({ role, status }: UseSwapRequestsListProps) {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<SwapRequestDetails[]>([])

  const { data, isLoading } = useGetSwapRequestsQuery({ role, status, page })

  useEffect(() => {
    if (data?.items) {
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id))
        const newItems = data.items.filter((item) => !existingIds.has(item.id))
        return [...prev, ...newItems]
      })
    }
  }, [data?.items])

  const loadMore = () => {
    if (data?.hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addItem = (item: SwapRequestDetails) => {
    setItems((prev) => [item, ...prev])
  }

  const reset = () => {
    setPage(1)
    setItems([])
  }

  return {
    items,
    isLoading,
    hasMore: data?.hasMore,
    loadMore,
    removeItem,
    addItem,
    reset,
  }
}
