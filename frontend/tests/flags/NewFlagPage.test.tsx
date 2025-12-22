import type { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '../../src/api/errors'
import type { Flag } from '../../src/flags/Flag'
import { findErrorElementFromFormInput } from '../test-helpers/form-helpers'
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
    flag.state = 'DISABLED'
    flag.defaultVariant = null
    flag.targeting = {
      if: [{ endsWith: [{ var: 'email' }, '@example.com'] }, 'off'],
    }
    flag.metadata = { team: 'platform' }
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

  it('shows errors when there are backend validation errors', async () => {
    server.use(
      http.put('/api/flags', () => HttpResponse.json({
        errors: {
          key: [{ message: 'Key is not valid.' }],
          state: [{ message: 'State is not valid.' }],
          variants: [{ message: 'Variants is not valid.' }, { message: 'Other error.' }],
          defaultVariant: [{ message: 'defaultVariant is not valid.' }],
          targeting: [{ message: 'Targeting is not valid.' }],
          metadata: [{ message: 'Metadata is not valid.' }],
        },
      } satisfies ValidationErrorBody<Flag>, { status: 422 })),
    )
    await inputFlag(user, FlagFactory.booleanFlag())
    await submitFlagForm(user)

    const expected: [HTMLElement, string][] = [
      [screen.getByLabelText('Key *'), 'Key is not valid.'],
      [screen.getByRole('textbox', { name: 'State' }), 'State is not valid.'],
      [screen.getByLabelText('Variants *'), 'Variants is not valid.<br>Other error.'],
      [screen.getByRole('textbox', { name: 'Default Variant' }), 'defaultVariant is not valid.'],
      [screen.getByLabelText('Targeting'), 'Targeting is not valid.'],
      [screen.getByLabelText('Metadata'), 'Metadata is not valid.'],
    ]
    for (const [input, expectedErrorText] of expected) {
      const errorElement = findErrorElementFromFormInput(input)
      expect.soft(errorElement.innerHTML).toEqual(`${expectedErrorText}<br>`)
    }
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
