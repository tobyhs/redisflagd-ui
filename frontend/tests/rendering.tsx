import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'

import { AppRoutes } from '../src/AppRoutes'
import { TestProvider, type TestProviderProps } from './TestProvider'

export function renderRoute(path: string, options: {
  testProviderProps?: TestProviderProps
} = {}) {
  window.history.replaceState(null, '', path)
  return render(
    <TestProvider {...options.testProviderProps}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TestProvider>,
  )
}
