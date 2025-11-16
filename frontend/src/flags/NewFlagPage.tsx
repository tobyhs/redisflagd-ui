import { Link } from 'react-router'

import { FlagForm } from './FlagForm'

/**
 * @returns component for the page to create a flag
 */
export function NewFlagPage() {
  return (
    <div>
      <h2>
        <Link to="/flags">Flags</Link>
        &nbsp;/ Create a new flag
      </h2>
      <FlagForm />
    </div>
  )
}
