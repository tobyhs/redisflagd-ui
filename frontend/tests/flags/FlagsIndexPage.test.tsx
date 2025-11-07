import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../mock-server'
import { renderRoute } from '../rendering'
import { FlagFactory } from './FlagFactory'

describe('FlagsIndexPage', () => {
  it('renders a progress bar when flags are loading', async () => {
    server.use(
      http.get('/api/flags', async () => { await delay('infinite') }),
    )
    renderRoute('/flags')
    await screen.findByRole('progressbar')
  })

  it('renders error text when there is an error with loading flags', async () => {
    server.use(
      http.get('/api/flags', () => new HttpResponse(null, { status: 500 }))
    )
    renderRoute('/flags')
    await screen.findByText('Error: Something went wrong when loading feature flags')
  })

  it('renders the empty state when there are no flags', async () => {
    server.use(
      http.get('/api/flags', () => HttpResponse.json([])),
    )
    renderRoute('/flags')
    await screen.findByText('No feature flags found')
  })

  it('renders flags when there are flags', async () => {
    server.use(
      http.get('/api/flags', () => {
        return HttpResponse.json([FlagFactory.booleanFlag(), FlagFactory.stringFlag()])
      }),
    )
    renderRoute('/flags')
    const cells = await screen.findAllByRole('cell')
    expect(cells.map(c => c.textContent)).toEqual([
      'basic-boolean', 'ENABLED', 'on',
      'basic-string', 'ENABLED', 'blue'
    ])
  })
})
