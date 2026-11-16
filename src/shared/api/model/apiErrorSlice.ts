import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ApiErrorStatus = 404 | 500

interface ApiErrorState {
  status: ApiErrorStatus | null
}

const initialState: ApiErrorState = {
  status: null,
}

const apiErrorSlice = createSlice({
  name: 'apiError',
  initialState,
  reducers: {
    setApiError: (state, action: PayloadAction<ApiErrorStatus>) => {
      state.status = action.payload
    },
    clearApiError: (state) => {
      state.status = null
    },
  },
})

export const { setApiError, clearApiError } = apiErrorSlice.actions

export default apiErrorSlice.reducer
