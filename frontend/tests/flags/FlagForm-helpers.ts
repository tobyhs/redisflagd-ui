import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

import type { Flag } from '../../src/flags/Flag'
import { keyboardEscape } from '../test-helpers/testing-library'

async function inputByLabelText(user: UserEvent, labelText: string, value: string) {
  const input = await screen.findByLabelText(labelText)
  await user.clear(input)
  if (value !== '') {
    await user.type(input, keyboardEscape(value))
  }
}

export async function inputKey(user: UserEvent, key: string) {
  await inputByLabelText(user, 'Key *', key)
}

export async function selectState(user: UserEvent, state: Flag['configuration']['state']) {
  await user.click(await screen.findByRole('textbox', { name: 'State' }))
  await user.click(await screen.findByRole('option', { name: state }))
}

export async function inputVariants(user: UserEvent, variants: string) {
  await inputByLabelText(user, 'Variants *', variants)
}

export async function selectDefaultVariant(user: UserEvent, defaultVariant: string | null) {
  await user.click(await screen.findByRole('textbox', { name: 'Default Variant' }))
  await user.click(await screen.findByRole('option', { name: defaultVariant ?? '' }))
}

export async function inputTargeting(user: UserEvent, targeting: string) {
  await inputByLabelText(user, 'Targeting', targeting)
}

export async function inputMetadata(user: UserEvent, metadata: string) {
  await inputByLabelText(user, 'Metadata', metadata)
}

export async function inputFlag(user: UserEvent, flag: Flag) {
  await inputKey(user, flag.key)
  await selectState(user, flag.configuration.state)
  await inputVariants(user, JSON.stringify(flag.configuration.variants))
  await selectDefaultVariant(user, flag.configuration.defaultVariant)
  const { metadata, targeting } = flag.configuration
  await inputTargeting(user, targeting ? JSON.stringify(targeting) : '')
  await inputMetadata(user, metadata ? JSON.stringify(metadata) : '')
}

export async function submitFlagForm(user: UserEvent) {
  await user.click(await screen.findByRole('button', { name: 'Save' }))
}
