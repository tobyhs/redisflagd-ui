import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'

import { AppRoutes } from '../src/AppRoutes'
import { TestProvider } from './TestProvider'

export function renderRoute(path: string) {
  window.history.replaceState(null, '', path)
  return render(
    <TestProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TestProvider>,
  )
}
