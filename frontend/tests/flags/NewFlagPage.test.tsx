import type { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../test-helpers/mock-server'
import { createQueryClient } from '../test-helpers/react-query'
import { renderRoute } from '../test-helpers/rendering'
import { keyboardEscape } from '../test-helpers/testing-library'
import { FlagFactory } from './FlagFactory'
import { inputFlag, inputVariants, submitFlagForm } from './FlagForm-helpers'
import { mockFlagsApi } from './mockFlagsApi'

describe('NewFlagPage', () => {
  let flagStore: Map<string, Flag>
  let queryClient: QueryClient
  let user: UserEvent

  const checkForNoFlagCreated = () => {
    expect(flagStore.size).toEqual(0)
    expect(window.location.pathname).toEqual('/flags/new')
  }

  beforeEach(() => {
    flagStore = new Map()
    mockFlagsApi(flagStore)
    queryClient = createQueryClient()
    user = userEvent.setup()
    renderRoute('/flags/new', { testProviderProps: { queryClient } })
  })

  it('renders a form to create a new flag', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const flag = FlagFactory.stringFlag()
    await inputFlag(user, flag)
    await submitFlagForm(user)

    await screen.findByText(`Flag saved: ${flag.key}`)
    expect.soft([...flagStore.values()]).toEqual([flag])
    expect.soft(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['flags', 'get', flag.key] })
    expect.soft(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['flags', 'list'] })
    expect.soft(window.location.pathname).toEqual('/flags')
  })

  it('saves flags with optional fields filled out', async () => {
    const flag = FlagFactory.booleanFlag()
    flag.configuration.state = 'DISABLED'
    flag.configuration.defaultVariant = null
    flag.configuration.targeting = {
      if: [{ endsWith: [{ var: 'email' }, '@example.com'] }, 'off'],
    }
    flag.configuration.metadata = { team: 'platform' }
    await inputFlag(user, flag)
    await submitFlagForm(user)
    expect([...flagStore.values()]).toEqual([flag])
  })

  it('does not save when key is blank', async () => {
    await submitFlagForm(user)
    checkForNoFlagCreated()
  })

  const checkInvalidJsonInField = async (labelText: string) => {
    await inputFlag(user, FlagFactory.booleanFlag())
    const input = screen.getByLabelText(labelText)
    await user.clear(input)
    await user.type(input, keyboardEscape('{"invalidJson"'))
    await submitFlagForm(user)
    await user.click(input)

    expect(input.ariaInvalid).toEqual('true')
    const describedBy = input.getAttribute('aria-describedby')
    if (!describedBy) {
      throw new Error('Expected input element to have an aria-describedby attribute')
    }
    const describedByElement = document.getElementById(describedBy)
    expect(describedByElement?.textContent).toEqual('Invalid JSON object')
    checkForNoFlagCreated()
  }

  it('does not save when variants is not a JSON object', async () => {
    await checkInvalidJsonInField('Variants *')
  })

  it('does not save when targeting is not a JSON object', async () => {
    await checkInvalidJsonInField('Targeting')
  })

  it('does not save when metadata is not a JSON object', async () => {
    await checkInvalidJsonInField('Metadata')
  })

  it('updates defaultVariant when the selected variant is no longer valid', async () => {
    await inputFlag(user, FlagFactory.stringFlag())
    await inputVariants(user, '{"black": "black", "white": "white"}')
    const input = screen.getByLabelText<HTMLInputElement>('Default Variant', { selector: 'input' })
    expect(input.value).toEqual('')
  })

  it('shows an error when the PUT request fails', async () => {
    server.use(
      http.put('/api/flags', () => HttpResponse.json({}, { status: 500 })),
    )
    await inputFlag(user, FlagFactory.booleanFlag())
    await submitFlagForm(user)
    await screen.findByText('An error occurred when saving the flag')
    checkForNoFlagCreated()
  })
})
