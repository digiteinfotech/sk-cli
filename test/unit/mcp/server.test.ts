import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createMcpServer } from '../../../bin/sk-mcp.js'

const BASE_URL = 'https://login.swiftkanban.com'

const mockServer = setupServer()

beforeAll(() => {
  process.env.SK_SERVER = BASE_URL
  process.env.SK_TOKEN = 'test-token'
  mockServer.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  mockServer.resetHandlers()
})
afterAll(() => {
  delete process.env.SK_SERVER
  delete process.env.SK_TOKEN
  mockServer.close()
})

async function createConnectedClient() {
  const server = createMcpServer()
  const client = new Client({ name: 'test-client', version: '1.0.0' })

  const [clientTransport, serverTransport] = createInProcessTransports()
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ])

  return { client, server }
}

function createInProcessTransports() {
  // Create paired in-process transports using ReadableStream/WritableStream
  const clientToServer = new TransformStream()
  const serverToClient = new TransformStream()

  const clientTransport = {
    start: async () => {},
    close: async () => {
      await clientToServer.writable.close().catch(() => {})
      await serverToClient.writable.close().catch(() => {})
    },
    send: async (message: unknown) => {
      const writer = clientToServer.writable.getWriter()
      await writer.write(message)
      writer.releaseLock()
    },
    onclose: undefined as (() => void) | undefined,
    onerror: undefined as ((error: Error) => void) | undefined,
    onmessage: undefined as ((message: unknown) => void) | undefined,
    _readable: serverToClient.readable,
    _startReading() {
      const reader = this._readable.getReader()
      const self = this
      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            self.onmessage?.(value)
          }
          self.onclose?.()
        } catch (error) {
          self.onerror?.(error as Error)
        }
      })()
    },
  }

  const serverTransport = {
    start: async () => {},
    close: async () => {
      await serverToClient.writable.close().catch(() => {})
      await clientToServer.writable.close().catch(() => {})
    },
    send: async (message: unknown) => {
      const writer = serverToClient.writable.getWriter()
      await writer.write(message)
      writer.releaseLock()
    },
    onclose: undefined as (() => void) | undefined,
    onerror: undefined as ((error: Error) => void) | undefined,
    onmessage: undefined as ((message: unknown) => void) | undefined,
    _readable: clientToServer.readable,
    _startReading() {
      const reader = this._readable.getReader()
      const self = this
      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            self.onmessage?.(value)
          }
          self.onclose?.()
        } catch (error) {
          self.onerror?.(error as Error)
        }
      })()
    },
  }

  // Patch start to begin reading
  const origClientStart = clientTransport.start
  clientTransport.start = async () => {
    await origClientStart()
    clientTransport._startReading()
  }
  const origServerStart = serverTransport.start
  serverTransport.start = async () => {
    await origServerStart()
    serverTransport._startReading()
  }

  return [clientTransport, serverTransport] as const
}

describe('MCP Server', () => {
  it('registers all 9 tools', async () => {
    const { client } = await createConnectedClient()
    const { tools } = await client.listTools()
    const toolNames = tools.map((t) => t.name).sort()
    expect(toolNames).toEqual([
      'create_card',
      'delete_card',
      'get_board',
      'get_card',
      'get_config',
      'list_boards',
      'list_cards',
      'login',
      'update_card',
    ])
    await client.close()
  })

  it('list_boards returns boards from API', async () => {
    mockServer.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards`, ({ request }) => {
        expect(request.headers.get('AuthorizationToken')).toBe('test-token')
        return HttpResponse.json({
          Response: {
            details: {
              board: [
                { boardId: '123', projectName: 'Test Board', currentState: 'Active' },
              ],
            },
            messageView: { type: 'success', message: ['OK'] },
          },
        })
      }),
    )

    const { client } = await createConnectedClient()
    const result = await client.callTool({ name: 'list_boards', arguments: {} })
    const data = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(data).toHaveLength(1)
    expect(data[0].boardId).toBe('123')
    expect(data[0].projectName).toBe('Test Board')
    await client.close()
  })

  it('get_config returns current configuration', async () => {
    const { client } = await createConnectedClient()
    const result = await client.callTool({ name: 'get_config', arguments: {} })
    const data = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(data.server).toBe(BASE_URL)
    expect(data.hasToken).toBe(true)
    await client.close()
  })

  it('returns error when API fails', async () => {
    mockServer.use(
      http.get(`${BASE_URL}/restapi/board-operations/boards`, () => {
        return new HttpResponse(null, { status: 401 })
      }),
    )

    const { client } = await createConnectedClient()
    const result = await client.callTool({ name: 'list_boards', arguments: {} })
    expect(result.isError).toBe(true)
    const text = (result.content as Array<{ text: string }>)[0].text
    expect(text).toContain('AUTH_FAILED')
    await client.close()
  })
})
