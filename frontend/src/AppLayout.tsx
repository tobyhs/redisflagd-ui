import { Notifications } from '@mantine/notifications'
import { Outlet } from 'react-router'

export function AppLayout() {
  return (
    <>
      <h1>RedisFlagd UI</h1>
      <Notifications />
      <Outlet />
    </>
  )
}
