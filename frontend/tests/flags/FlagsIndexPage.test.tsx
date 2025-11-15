import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../test-helpers/mock-server'
import { renderRoute } from '../test-helpers/rendering'
import { FlagFactory } from './FlagFactory'
import { mockFlagsApi } from './mockFlagsApi'

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
      http.get('/api/flags', () => new HttpResponse(null, { status: 500 })),
    )
    renderRoute('/flags')
    await screen.findByText('Error: Something went wrong when loading feature flags')
  })

  it('renders the empty state when there are no flags', async () => {
    mockFlagsApi()
    renderRoute('/flags')
    await screen.findByText('No feature flags found')
  })

  const stubFlagsApiWithFlags = () => {
    const flagStore = new Map<string, Flag>()
    for (const flag of [FlagFactory.booleanFlag(), FlagFactory.stringFlag()]) {
      flagStore.set(flag.key, flag)
    }
    mockFlagsApi(flagStore)
  }

  it('renders flags when there are flags', async () => {
    stubFlagsApiWithFlags()
    renderRoute('/flags')
    const cells = await screen.findAllByRole('cell')
    expect(cells.map(c => c.textContent)).toEqual([
      'basic-boolean', 'ENABLED', 'on',
      'basic-string', 'ENABLED', 'blue',
    ])
  })

  it('filters flags after entering a pattern', async () => {
    stubFlagsApiWithFlags()
    const user = userEvent.setup()
    renderRoute('/flags')

    const patternInput = await screen.findByPlaceholderText('Pattern Search')
    await user.type(patternInput, '*bool*{Enter}')

    const cells = await screen.findAllByRole('cell')
    expect(window.location.search).toEqual('?pattern=*bool*')
    expect(cells.map(c => c.textContent)).toEqual([
      'basic-boolean', 'ENABLED', 'on',
    ])
  })

  it('filters flags if the pattern query parameter is given', async () => {
    stubFlagsApiWithFlags()
    renderRoute('/flags?pattern=*str*')
    const patternInput: HTMLInputElement = await screen.findByPlaceholderText('Pattern Search')
    expect(patternInput.value).toEqual('*str*')
    const cells = await screen.findAllByRole('cell')
    expect(cells.map(c => c.textContent)).toEqual([
      'basic-string', 'ENABLED', 'blue',
    ])
  })

  it('removes the pattern query parameter when clearing the input', async () => {
    stubFlagsApiWithFlags()
    const user = userEvent.setup()
    renderRoute('/flags?pattern=test*')

    const patternInput = await screen.findByPlaceholderText('Pattern Search')
    await user.clear(patternInput)
    await user.type(patternInput, '{Enter}')
    expect(window.location.search).toEqual('')
  })
})
