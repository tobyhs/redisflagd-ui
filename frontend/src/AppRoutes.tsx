import { Route, Routes } from 'react-router'

import { AppLayout } from './AppLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<div>Page not found</div>} />
      </Route>
    </Routes>
  )
}
