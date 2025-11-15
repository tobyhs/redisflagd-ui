import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import App from '../src/App'
import { server } from './test-helpers/mock-server'
import { renderRoute } from './test-helpers/rendering'

describe('AppRoutes', () => {
  it('redirects / to /flags', () => {
    server.use(
      http.get('/api/flags', () => HttpResponse.json([])),
    )
    // Instead of renderRoute('/'), I'm rendering App so it has test coverage
    render(<App />)
    expect(window.location.pathname).toEqual('/flags')
  })

  it('renders "Page not found" when no route matches', async () => {
    renderRoute('/404')
    await screen.findByText('Page not found')
  })
})
