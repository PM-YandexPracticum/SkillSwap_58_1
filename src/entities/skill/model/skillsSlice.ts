import { Skill } from '@/shared/types/index.ts'
import { fetchSkills } from '@/api/skills.ts'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

interface SkillsState {
  skills: Skill[]
  isLoading: boolean
  error: string | null
}

const initialState: SkillsState = {
  skills: [],
  isLoading: false,
  error: null,
}

interface LoadSkillsParams {
  type?: string
  category?: string
}

export const loadSkills = createAsyncThunk('skills/load', async (params?: LoadSkillsParams) => {
  const data = await fetchSkills(params)
  return data
})

export const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {},
  selectors: {
    selectSkills: (state) => state.skills,
    selectSkillsLoading: (state) => state.isLoading,
    selectSkillsError: (state) => state.error,
  },
  extraReducers: (builder) => {
    builder.addCase(loadSkills.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(loadSkills.fulfilled, (state, action) => {
      state.isLoading = false
      state.skills = action.payload
    })
    builder.addCase(loadSkills.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Ошибка загрузки навыков'
    })
  },
})

export const { selectSkills, selectSkillsLoading, selectSkillsError } = skillsSlice.selectors

export default skillsSlice.reducer
