import { Table } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

import type { Flag } from './Flag'

/**
 * @returns component that lists feature flags
 */
export function FlagsIndexPage() {
  const { isPending, isError, data: flags } = useQuery({
    queryKey: ['flags', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/flags')
      if (!response.ok) {
        throw new Error(await response.text())
      }
      return await response.json() as Flag[]
    },
  })

  if (isPending) {
    return <progress />
  } else if (isError) {
    return <div>Error: Something went wrong when loading feature flags</div>
  } else if (flags.length === 0) {
    return <div>No feature flags found</div>
  } else {
    return <FlagsList flags={flags} />
  }
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
            <Table.Td>{flag.key}</Table.Td>
            <Table.Td>{flag.configuration.state}</Table.Td>
            <Table.Td>{flag.configuration.defaultVariant}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
