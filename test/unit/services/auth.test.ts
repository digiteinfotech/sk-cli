import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { login } from '../../../src/services/auth.js'
import { ApiError } from '../../../src/api/types.js'

const BASE_URL = 'https://test.swiftkanban.com'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('login', () => {
  it('returns token and user data on success', async () => {
    server.use(
      http.post(`${BASE_URL}/restapi/secured/auth`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe('text/plain')
        const body = await request.text()
        const parsed = JSON.parse(body)
        const b64 = Buffer.from('user@test.com:pass123').toString('base64')
        expect(parsed.AuthenticationToken).toBe(`SwiftKanban ${b64}`)

        return HttpResponse.json({
          Response: {
            details: {
              userData: {
                firstName: 'Test',
                lastName: 'User',
                loginId: 'user@test.com',
                emailId: 'user@test.com',
                personId: 123,
              },
              authDetails: {
                AuthorizationToken: 'jwt-token-here',
              },
            },
            messageView: {
              type: 'success',
              message: ['Authentication Successful!'],
            },
          },
        }, { status: 201 })
      }),
    )

    const result = await login(BASE_URL, 'user@test.com', 'pass123')
    expect(result.token).toBe('jwt-token-here')
    expect(result.user.firstName).toBe('Test')
    expect(result.user.lastName).toBe('User')
    expect(result.user.email).toBe('user@test.com')
  })

  it('throws ApiError on 401 (not integration user)', async () => {
    server.use(
      http.post(`${BASE_URL}/restapi/secured/auth`, () => {
        return HttpResponse.json({
          Response: {
            details: {},
            messageView: {
              type: 'error',
              message: ['Rest API access is allowed only for Integration User.'],
            },
          },
        }, { status: 401 })
      }),
    )

    await expect(login(BASE_URL, 'user@test.com', 'pass123'))
      .rejects.toThrow(ApiError)
    await expect(login(BASE_URL, 'user@test.com', 'pass123'))
      .rejects.toMatchObject({
        code: 'AUTH_FAILED',
        status: 401,
      })
  })

  it('throws ApiError when response has no token', async () => {
    server.use(
      http.post(`${BASE_URL}/restapi/secured/auth`, () => {
        return HttpResponse.json({
          Response: {
            details: {},
            messageView: {
              type: 'success',
              message: ['Authentication Successful!'],
            },
          },
        }, { status: 201 })
      }),
    )

    await expect(login(BASE_URL, 'user@test.com', 'pass123'))
      .rejects.toMatchObject({
        code: 'AUTH_FAILED',
        message: 'No token in response',
      })
  })

  it('encodes credentials as base64 in request body', async () => {
    let capturedBody = ''
    server.use(
      http.post(`${BASE_URL}/restapi/secured/auth`, async ({ request }) => {
        capturedBody = await request.text()
        return HttpResponse.json({
          Response: {
            details: {
              userData: { firstName: 'A', lastName: 'B', loginId: 'a@b.com', emailId: 'a@b.com', personId: 1 },
              authDetails: { AuthorizationToken: 'tok' },
            },
            messageView: { type: 'success', message: ['OK'] },
          },
        }, { status: 201 })
      }),
    )

    await login(BASE_URL, 'special@chars.com', 'p@ss:w0rd!')
    const parsed = JSON.parse(capturedBody)
    const expected = Buffer.from('special@chars.com:p@ss:w0rd!').toString('base64')
    expect(parsed.AuthenticationToken).toBe(`SwiftKanban ${expected}`)
  })
})
