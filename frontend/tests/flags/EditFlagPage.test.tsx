import type { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { userEvent, type UserEvent } from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../test-helpers/mock-server'
import { createQueryClient } from '../test-helpers/react-query'
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

  describe('after clicking the Delete button', () => {
    let flag: Flag
    let flagStore: Map<string, Flag>
    let user: UserEvent
    let queryClient: QueryClient

    beforeEach(async () => {
      flag = FlagFactory.stringFlag()
      flagStore = new Map()
      flagStore.set(flag.key, flag)
      mockFlagsApi(flagStore)
      queryClient = createQueryClient()

      user = userEvent.setup()
      renderRoute(`/flags/${flag.key}/edit`, { testProviderProps: { queryClient } })
      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
    })

    it('closes the modal after clicking the No button', async () => {
      const noButton = await screen.findByRole('button', { name: 'No' })
      await user.click(noButton)
      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to delete this flag?')).toBeNull()
      })
    })

    describe('after clicking the Yes button', () => {
      it('deletes the flag', async () => {
        const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
        const yesButton = await screen.findByRole('button', { name: 'Yes' })
        await user.click(yesButton)

        await screen.findByText(`Flag deleted: ${flag.key}`)
        expect.soft(flagStore.size).toEqual(0)
        expect.soft(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['flags', 'get', flag.key],
          refetchType: 'none',
        })
        expect.soft(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['flags', 'list'] })
        expect.soft(window.location.pathname).toEqual('/flags')
      })

      it('shows an error notification if an error occurred', async () => {
        server.use(
          http.delete(`/api/flags/${flag.key}`, () => new HttpResponse(null, { status: 500 })),
        )
        const yesButton = await screen.findByRole('button', { name: 'Yes' })
        await user.click(yesButton)

        await screen.findByText('An error occurred when deleting the flag')
        expect(window.location.pathname).toEqual(`/flags/${flag.key}/edit`)
      })
    })
  })
})
