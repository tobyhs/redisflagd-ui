import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AppRoutes } from '../src/AppRoutes';
import { TestProvider } from './TestProvider';

export function renderRoute(path: string) {
  return render(
    <TestProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </TestProvider>
  )
}
