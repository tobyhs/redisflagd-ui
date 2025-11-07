import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it } from 'vitest'

import App from '../src/App'
import { server } from './mock-server'
import { renderRoute } from './rendering'

describe('AppRoutes', () => {
  it('redirects / to /flags', async () => {
    server.use(
      http.get('/api/flags', () => HttpResponse.json([])),
    )
    // Instead of renderRoute('/'), I'm rendering App so it has test coverage
    render(<App />)
    await screen.findByText('No feature flags found')
  })

  it('renders "Page not found" when no route matches', async () => {
    renderRoute('/404')
    await screen.findByText('Page not found')
  })
})
