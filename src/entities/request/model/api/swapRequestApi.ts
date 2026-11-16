import { baseApi } from '@/shared/api'
import type { RequestStatus, SwapRequestDetails } from '@/shared/types'

export type SwapRequestRole = 'incoming' | 'outgoing' | 'all'
export type SwapRequestStatus = Extract<RequestStatus, 'pending' | 'accepted' | 'rejected'>

type GetSwapRequestsArgs = {
  role?: SwapRequestRole
  status?: SwapRequestStatus
  page?: number
  limit?: number
}

type GetSwapRequestsResponse = {
  items: SwapRequestDetails[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

type RespondArgs = {
  id: string
  status: Extract<RequestStatus, 'accepted' | 'rejected'>
}

export const swapRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSwapRequests: builder.query<GetSwapRequestsResponse, GetSwapRequestsArgs>({
      query: ({ role, status, page, limit }) => {
        const params: Record<string, string | number> = {}

        if (role) params.role = role
        if (status) params.status = status
        if (page) params.page = page
        if (limit) params.limit = limit

        return { url: '/swap-requests', params }
      },
      providesTags: ['SwapRequest'],
    }),

    createSwapRequest: builder.mutation<SwapRequestDetails, { skillId: string }>({
      query: ({ skillId }) => ({
        url: '/swap-requests',
        method: 'POST',
        body: { skillId },
      }),
      invalidatesTags: ['SwapRequest'],
    }),

    respondToSwapRequest: builder.mutation<SwapRequestDetails, RespondArgs>({
      query: ({ id, status }) => ({
        url: `/swap-requests/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['SwapRequest'],
    }),

    deleteSwapRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/swap-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SwapRequest'],
    }),
  }),
})

export const {
  useGetSwapRequestsQuery,
  useCreateSwapRequestMutation,
  useRespondToSwapRequestMutation,
  useDeleteSwapRequestMutation,
} = swapRequestApi
