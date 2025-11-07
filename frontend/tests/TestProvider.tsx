import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

type TestProviderProps = PropsWithChildren<{
  queryClient?: QueryClient
}>

export function TestProvider({ queryClient = createQueryClient(), children }: TestProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider env="test">
        {children}
      </MantineProvider>
    </QueryClientProvider>
  )
}
