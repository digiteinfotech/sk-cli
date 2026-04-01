import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { RestClient } from '../../../src/api/client.js'
import { ApiError } from '../../../src/api/types.js'

const BASE_URL = 'https://test.swiftkanban.com'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createClient(token?: string) {
  return new RestClient({
    server: BASE_URL,
    token,
    format: 'json',
  })
}

describe('RestClient', () => {
  it('makes GET requests with auth header', async () => {
    server.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards`, ({ request }) => {
        expect(request.headers.get('AuthorizationToken')).toBe('test-token')
        return HttpResponse.json({ Response: { details: { board: [] }, messageView: { type: 'success' } } })
      }),
    )

    const client = createClient('test-token')
    const result = await client.get('/restapi/board-operations/boards')
    expect(result).toEqual({ Response: { details: { board: [] }, messageView: { type: 'success' } } })
  })

  it('makes POST requests with body', async () => {
    server.use(
      http.post(`${BASE_URL}/restapi/card-operations/boards/B1/cards`, async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ name: 'New Card' })
        return HttpResponse.json({ Response: { details: { cardDetails: { id: 'C1', name: 'New Card' } }, messageView: { type: 'success' } } })
      }),
    )

    const client = createClient('test-token')
    const result = await client.post('/restapi/card-operations/boards/B1/cards', { name: 'New Card' })
    expect(result).toEqual({ Response: { details: { cardDetails: { id: 'C1', name: 'New Card' } }, messageView: { type: 'success' } } })
  })

  it('throws ApiError on 401', async () => {
    server.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards`, () => {
        return new HttpResponse(null, { status: 401 })
      }),
    )

    const client = createClient('bad-token')
    await expect(client.get('/restapi/board-operations/boards')).rejects.toThrow(ApiError)
    await expect(client.get('/restapi/board-operations/boards')).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      status: 401,
    })
  })

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards/nonexistent`, () => {
        return new HttpResponse(null, { status: 404 })
      }),
    )

    const client = createClient('test-token')
    await expect(client.get('/restapi/board-operations/boards/nonexistent')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    })
  })

  it('sends requests without auth when no token', async () => {
    server.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards`, ({ request }) => {
        expect(request.headers.get('AuthorizationToken')).toBeNull()
        return HttpResponse.json({ Response: { details: { board: [] }, messageView: { type: 'success' } } })
      }),
    )

    const client = createClient()
    const result = await client.get('/restapi/board-operations/boards')
    expect(result).toEqual({ Response: { details: { board: [] }, messageView: { type: 'success' } } })
  })
})
