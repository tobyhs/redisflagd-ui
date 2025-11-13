import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { createQueryClient } from './utils'

export interface TestProviderProps {
  queryClient?: QueryClient
}

export function TestProvider({
  queryClient = createQueryClient(),
  children,
}: PropsWithChildren<TestProviderProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider env="test">
        {children}
      </MantineProvider>
    </QueryClientProvider>
  )
}
