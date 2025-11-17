import { useQuery } from '@tanstack/react-query'
import type { JSX } from 'react'
import { Link, useParams } from 'react-router'

import type { Flag } from './Flag'
import { FlagForm } from './FlagForm'

/**
 * @returns component for the page to edit a flag
 */
export function EditFlagPage() {
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const flagKey = params.key!
  const { isPending, isError, data: flag } = useQuery({
    queryKey: ['flags', 'get', flagKey],
    queryFn: async () => {
      const response = await fetch(`/api/flags/${encodeURIComponent(flagKey)}`)
      if (response.status === 404) {
        return null
      } else if (!response.ok) {
        throw new Error(await response.text())
      } else {
        return await response.json() as Flag
      }
    },
  })

  let content: JSX.Element
  if (isPending) {
    content = <progress />
  } else if (isError) {
    content = <div>An error occurred when fetching the flag</div>
  } else if (flag === null) {
    content = <div>Flag not found</div>
  } else {
    content = <FlagForm flag={flag} />
  }

  return (
    <div>
      <h2>
        <Link to="/flags">Flags</Link>
        &nbsp;/&nbsp;
        {flagKey}
      </h2>
      {content}
    </div>
  )
}
