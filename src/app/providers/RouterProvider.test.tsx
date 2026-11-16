import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ApiErrorRedirect } from './RouterProvider'
import apiErrorReducer, { setApiError } from '@/shared/api/model/apiErrorSlice'

const createTestStore = () =>
  configureStore({
    reducer: {
      apiError: apiErrorReducer,
    },
  })

const renderWithError = (status: 404 | 500 | null) => {
  const store = createTestStore()

  if (status !== null) {
    store.dispatch(setApiError(status))
  }

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/catalog']}>
        <ApiErrorRedirect />

        <Routes>
          <Route path="/catalog" element={<div>Каталог</div>} />
          <Route path="/404" element={<div>Страница не найдена</div>} />
          <Route path="/500" element={<div>Ошибка сервера</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  return store
}

describe('ApiErrorRedirect', () => {
  it('перенаправляет на страницу 404', async () => {
    const store = renderWithError(404)

    expect(await screen.findByText('Страница не найдена')).toBeInTheDocument()

    await waitFor(() => {
      expect(store.getState().apiError.status).toBeNull()
    })
  })

  it('перенаправляет на страницу 500', async () => {
    const store = renderWithError(500)

    expect(await screen.findByText('Ошибка сервера')).toBeInTheDocument()

    await waitFor(() => {
      expect(store.getState().apiError.status).toBeNull()
    })
  })

  it('не перенаправляет, если ошибки нет', () => {
    const store = renderWithError(null)

    expect(screen.getByText('Каталог')).toBeInTheDocument()
    expect(store.getState().apiError.status).toBeNull()
  })
})
