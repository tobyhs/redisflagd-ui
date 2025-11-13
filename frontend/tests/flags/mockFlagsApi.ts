import { http, HttpResponse } from 'msw'
import picomatch from 'picomatch'

import type { Flag } from '../../src/flags/Flag'
import { server } from '../mock-server'

export function mockFlagsApi(flagStore: Map<string, Flag> = new Map<string, Flag>()) {
  server.use(
    http.get('/api/flags', ({ request }) => {
      const pattern = new URL(request.url).searchParams.get('pattern')
      let flags = [...flagStore.values()]
      if (pattern) {
        const isMatch = picomatch(pattern)
        flags = flags.filter(flag => isMatch(flag.key))
      }
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
