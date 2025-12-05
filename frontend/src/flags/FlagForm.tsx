import { Button, JsonInput, type JsonInputProps, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { showNotification } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { Flag } from './Flag'

const NEW_FLAG_INITIAL_VALUES = {
  key: '',
  state: 'ENABLED' as Flag['state'],
  variants: '{}',
  defaultVariant: '',
  targeting: '',
  metadata: '',
}

export type FlagFormValues = typeof NEW_FLAG_INITIAL_VALUES

function transformFlagToFormValues(flag: Flag): FlagFormValues {
  const { key, state, variants, defaultVariant, targeting, metadata } = flag
  return {
    key,
    state,
    variants: JSON.stringify(variants, undefined, 2),
    defaultVariant: defaultVariant ?? '',
    targeting: targeting ? JSON.stringify(targeting, undefined, 2) : '',
    metadata: metadata ? JSON.stringify(metadata, undefined, 2) : '',
  }
}

function transformFormValuesToFlag({
  key, state, variants, defaultVariant, targeting, metadata,
}: FlagFormValues): Flag {
  return {
    key,
    state,
    variants: JSON.parse(variants) as Flag['variants'],
    defaultVariant: defaultVariant === '' ? null : defaultVariant,
    ...(targeting !== '' && { targeting: JSON.parse(targeting) as Flag['targeting'] }),
    ...(metadata !== '' && { metadata: JSON.parse(metadata) as Flag['metadata'] }),
  }
}

function isJsonObject(value: string): boolean {
  try {
    return typeof JSON.parse(value) === 'object'
  } catch {
    return false
  }
}

function deriveVariantChoices(serializedVariants: string): string[] {
  const keys = Object.keys(JSON.parse(serializedVariants) as Flag['variants'])
  return [''].concat(keys.filter(key => key !== ''))
}

const JSON_INPUT_COMMON_PROPS: Partial<JsonInputProps> = {
  autosize: true,
  resize: 'both',
  minRows: 4,
  formatOnBlur: true,
}

interface FlagFormProps {
  /** the flag to edit, or undefined for creating a new flag */
  flag?: Flag
}

/**
 * @returns a component with a form to create a flag
 */
export function FlagForm({ flag }: FlagFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: flag ? transformFlagToFormValues(flag) : NEW_FLAG_INITIAL_VALUES,
    transformValues: transformFormValuesToFlag,
    validateInputOnBlur: true,
    validate: {
      variants: value => isJsonObject(value) ? null : 'Invalid JSON object',
      targeting: value => (value === '' || isJsonObject(value)) ? null : 'Invalid JSON object',
      metadata: value => (value === '' || isJsonObject(value)) ? null : 'Invalid JSON object',
    },
  })

  const [variantChoices, setVariantChoices] = useState(() => {
    return deriveVariantChoices(form.getInitialValues().variants)
  })
  form.watch('variants', ({ value }) => {
    let newVariantChoices: string[]
    try {
      newVariantChoices = deriveVariantChoices(value)
    } catch {
      return
    }
    setVariantChoices(newVariantChoices)
    const { defaultVariant } = form.getValues()
    if (!newVariantChoices.includes(defaultVariant)) {
      form.setFieldValue('defaultVariant', '')
    }
  })

  const handleSubmit = async (flag: Flag) => {
    const response = await fetch('/api/flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flag),
    })
    if (!response.ok) {
      showNotification({ color: 'red', message: 'An error occurred when saving the flag' })
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['flags', 'get', flag.key] })
    await queryClient.invalidateQueries({ queryKey: ['flags', 'list'] })
    showNotification({ message: `Flag saved: ${flag.key}` })
    await navigate('/flags')
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        key={form.key('key')}
        {...form.getInputProps('key')}
        label="Key"
        required
        disabled={Boolean(flag)}
        w="20em"
      />

      <Select
        key={form.key('state')}
        {...form.getInputProps('state')}
        label="State"
        required
        allowDeselect={false}
        data={['ENABLED', 'DISABLED']}
        w="8em"
      />

      <JsonInput
        key={form.key('variants')}
        {...form.getInputProps('variants')}
        label="Variants"
        {...JSON_INPUT_COMMON_PROPS}
        required
      />

      <Select
        key={form.key('defaultVariant')}
        {...form.getInputProps('defaultVariant')}
        label="Default Variant"
        allowDeselect={false}
        data={variantChoices}
      />

      <JsonInput
        key={form.key('targeting')}
        {...form.getInputProps('targeting')}
        label="Targeting"
        {...JSON_INPUT_COMMON_PROPS}
      />

      <JsonInput
        key={form.key('metadata')}
        {...form.getInputProps('metadata')}
        label="Metadata"
        {...JSON_INPUT_COMMON_PROPS}
      />

      <Button type="submit" loading={form.submitting}>Save</Button>
    </form>
  )
}
