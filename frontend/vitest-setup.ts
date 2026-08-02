import { cleanNotifications } from '@mantine/notifications'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from './tests/test-helpers/mock-server'

// window mocks from https://mantine.dev/guides/vitest/
window.HTMLElement.prototype.scrollIntoView = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
})
class ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
}
window.ResizeObserver = ResizeObserver

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanNotifications()
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
