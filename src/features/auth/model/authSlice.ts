import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser, User } from '@/shared/types'
import { clearAuthUser, clearUserProfile } from './authUtils'
import { baseApi } from '@/shared/api'

export interface AuthState {
  user: AuthUser | null
  profile: User | null
}

export interface LoginCredentials {
  email: string
  password: string
}

const initialState: AuthState = {
  user: null,
  profile: null,
}

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  clearAuthUser()
  clearUserProfile()
  dispatch(baseApi.util.resetApiState())
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
    },
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null
      state.profile = null
    })
  },
})

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user

export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.user !== null

export const selectProfile = (state: { auth: AuthState }) => state.auth.profile

export const { setAuthUser, setProfile } = authSlice.actions

export default authSlice.reducer
