import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './AppLayout'
import { FlagsIndexPage } from './flags/FlagsIndexPage'
import { NewFlagPage } from './flags/NewFlagPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/flags" />} />

        <Route path="flags">
          <Route index element={<FlagsIndexPage />} />
          <Route path="new" element={<NewFlagPage />} />
        </Route>

        <Route path="*" element={<div>Page not found</div>} />
      </Route>
    </Routes>
  )
}
