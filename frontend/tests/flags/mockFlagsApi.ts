import { http, HttpResponse } from 'msw'
import picomatch from 'picomatch'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../test-helpers/mock-server'

interface MockFlagsApiOptions {
  pageSize?: number
}

export function mockFlagsApi(
  flagStore: Map<string, Flag> = new Map<string, Flag>(),
  options: MockFlagsApiOptions = {},
) {
  server.use(
    http.get('/api/flags', ({ request }) => {
      const { searchParams } = new URL(request.url)
      let flags = [...flagStore.values()].sort((a, b) => a.key.localeCompare(b.key))
      const pattern = searchParams.get('pattern')
      if (pattern) {
        const isMatch = picomatch(pattern)
        flags = flags.filter(flag => isMatch(flag.key))
      }
      let startIndex = 0
      const after = searchParams.get('after')
      if (after) {
        startIndex = flags.findIndex(flag => flag.key.localeCompare(after) === 1)
        if (startIndex === -1) {
          startIndex = flags.length
        }
      }
      flags = flags.slice(startIndex, options.pageSize && (startIndex + options.pageSize))
      return HttpResponse.json(flags)
    }),

    http.get<{ key: string }>('/api/flags/:key', ({ params }) => {
      const flag = flagStore.get(params.key)
      if (flag) {
        return HttpResponse.json(flag)
      } else {
        return HttpResponse.json({ error: 'Not Found' }, { status: 404 })
      }
    }),

    http.put('/api/flags', async ({ request }) => {
      const flag = await request.clone().json() as Flag
      flagStore.set(flag.key, flag)
      return HttpResponse.json(flag)
    }),

    http.delete<{ key: string }>('/api/flags/:key', ({ params }) => {
      if (flagStore.delete(params.key)) {
        return new HttpResponse(null, { status: 204 })
      } else {
        return HttpResponse.json({ error: 'Not Found' }, { status: 404 })
      }
    }),
  )
}
