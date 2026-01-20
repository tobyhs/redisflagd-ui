import { ActionIcon, Button, Group, Loader, Stack, Table, TextInput, Tooltip } from '@mantine/core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { type JSX, type KeyboardEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import type { Flag } from './Flag'

/**
 * @returns component that lists feature flags
 */
export function FlagsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pattern = searchParams.get('pattern')
  const [patternValue, setPatternValue] = useState(pattern ?? '')
  const {
    isPending,
    isError,
    data: flagsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['flags', 'list', { pattern }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pattern) {
        params.set('pattern', pattern)
      }
      if (pageParam) {
        params.set('after', pageParam)
      }
      const queryStr = params.size === 0 ? '' : `?${params.toString()}`
      const response = await fetch(`/api/flags${queryStr}`)
      if (!response.ok) {
        throw new Error(await response.text())
      }
      return await response.json() as Flag[]
    },
    initialPageParam: '',
    getNextPageParam: lastPage => lastPage.at(-1)?.key,
  })

  let content: JSX.Element
  if (isPending) {
    content = <Loader role="progressbar" />
  } else if (isError) {
    content = <div>Error: Something went wrong when loading feature flags</div>
  } else {
    const flags = flagsData.pages.flat()
    if (flags.length === 0) {
      content = <div>No feature flags found</div>
    } else {
      content = (
        <>
          <FlagsList flags={flags} />
          { hasNextPage && (
            <div>
              <Button onClick={() => void fetchNextPage()} loading={isFetchingNextPage}>
                Load More
              </Button>
            </div>
          )}
        </>
      )
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchParams((sp) => {
        if (patternValue === '') {
          sp.delete('pattern')
        } else {
          sp.set('pattern', patternValue)
        }
        return sp
      })
      e.stopPropagation()
    }
  }

  return (
    <Stack>
      <Group>
        <Tooltip label="Create a new flag">
          <Link to="/flags/new">
            <ActionIcon aria-label="Create a new flag">+</ActionIcon>
          </Link>
        </Tooltip>
        <TextInput
          placeholder="Pattern Search"
          w="20em"
          value={patternValue}
          onChange={(e) => { setPatternValue(e.currentTarget.value) }}
          onKeyDown={onKeyDown}
        />
      </Group>
      {content}
    </Stack>
  )
}

function FlagsList({ flags }: { flags: Flag[] }) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Key</Table.Th>
          <Table.Th>State</Table.Th>
          <Table.Th>Default Variant</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {flags.map(flag => (
          <Table.Tr key={flag.key}>
            <Table.Td>
              <Link to={`/flags/${encodeURIComponent(flag.key)}/edit`}>{flag.key}</Link>
            </Table.Td>
            <Table.Td>{flag.state}</Table.Td>
            <Table.Td>{flag.defaultVariant}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
