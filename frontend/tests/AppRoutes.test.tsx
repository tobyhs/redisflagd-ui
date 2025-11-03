import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderRoute } from './rendering'

describe('AppRoutes', () => {
  it('renders "Page not found" when no route matches', async () => {
    renderRoute('/404')
    await screen.findByText('Page not found')
  })
})
