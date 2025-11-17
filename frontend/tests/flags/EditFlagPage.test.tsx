import { screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../test-helpers/mock-server'
import { renderRoute } from '../test-helpers/rendering'
import { FlagFactory } from './FlagFactory'
import { extractFlagFormValues } from './FlagForm-helpers'
import { mockFlagsApi } from './mockFlagsApi'

describe('EditFlagPage', () => {
  it('renders a progress bar when the flag is loading', async () => {
    server.use(
      http.get('/api/flags/key', async () => { await delay('infinite') }),
    )
    renderRoute('/flags/key/edit')
    await screen.findByRole('progressbar')
  })

  it('renders error text when there is an error with loading the flag', async () => {
    server.use(
      http.get('/api/flags/key', () => new HttpResponse(null, { status: 500 })),
    )
    renderRoute('/flags/key/edit')
    await screen.findByText('An error occurred when fetching the flag')
  })

  it('renders when the flag is not found', async () => {
    mockFlagsApi()
    renderRoute('/flags/nothing/edit')
    await screen.findByText('Flag not found')
  })

  it('renders a form to edit a flag', async () => {
    const flag = FlagFactory.stringFlag()
    server.use(
      http.get(`/api/flags/${flag.key}`, () => HttpResponse.json(flag)),
    )
    renderRoute(`/flags/${flag.key}/edit`)

    const keyInput = await screen.findByLabelText<HTMLInputElement>('Key *')
    expect.soft(keyInput.disabled).toEqual(true)
    const formValues = await extractFlagFormValues()
    expect.soft(formValues.key).toEqual(flag.key)
    expect.soft(formValues.state).toEqual(flag.configuration.state)
    expect.soft(JSON.parse(formValues.variants)).toEqual(flag.configuration.variants)
    expect.soft(formValues.defaultVariant).toEqual(flag.configuration.defaultVariant)
    expect.soft(formValues.targeting).toEqual('')
    expect.soft(formValues.metadata).toEqual('')
  })

  it('renders a form to edit a flag (with optional fields present)', async () => {
    const flag: Flag = {
      key: 'testing',
      configuration: {
        state: 'DISABLED',
        variants: { one: 1, two: 2 },
        defaultVariant: null,
        targeting: { fractional: [['one', 50], ['two', 50]] },
        metadata: { team: 'test' },
      },
    }
    server.use(
      http.get(`/api/flags/${flag.key}`, () => HttpResponse.json(flag)),
    )
    renderRoute(`/flags/${flag.key}/edit`)

    const formValues = await extractFlagFormValues()
    expect.soft(formValues.key).toEqual(flag.key)
    expect.soft(formValues.state).toEqual(flag.configuration.state)
    expect.soft(JSON.parse(formValues.variants)).toEqual(flag.configuration.variants)
    expect.soft(formValues.defaultVariant).toEqual('')
    expect.soft(JSON.parse(formValues.targeting)).toEqual(flag.configuration.targeting)
    expect.soft(JSON.parse(formValues.metadata)).toEqual(flag.configuration.metadata)
  })
})
