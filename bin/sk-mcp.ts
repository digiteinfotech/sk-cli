import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { RestClient } from '../src/api/client.js'
import { ApiError } from '../src/api/types.js'
import { resolveConfig, saveConfigValue } from '../src/config/index.js'
import { login } from '../src/services/auth.js'
import { listBoards, getBoard } from '../src/services/boards.js'
import { listCards, getCard, createCard, updateCard, deleteCard } from '../src/services/cards.js'

function makeClient() {
  const config = resolveConfig()
  return { client: new RestClient(config), config }
}

function errorResult(error: unknown) {
  const message = error instanceof ApiError
    ? `${error.code}: ${error.message}`
    : error instanceof Error ? error.message : String(error)
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function requireBoardId(boardId: string | undefined, defaultBoardId: string | undefined): string {
  const id = boardId || defaultBoardId
  if (!id) {
    throw new ApiError('VALIDATION_ERROR', 'board_id is required. Provide it as a parameter or set SK_BOARD_ID env var.')
  }
  return id
}

export function createMcpServer() {
  const server = new McpServer({
    name: 'sk-swiftkanban',
    version: '0.1.0',
  })

  server.registerTool(
    'login',
    {
      title: 'Login to SwiftKanban',
      description: 'Authenticate with SwiftKanban using email and password. Saves the JWT token for subsequent tool calls.',
      inputSchema: z.object({
        user: z.string().describe('Login email address'),
        password: z.string().describe('Login password'),
        server: z.string().optional().describe('SwiftKanban server URL (default: https://login.swiftkanban.com)'),
      }),
    },
    async ({ user, password, server: serverUrl }) => {
      try {
        const config = resolveConfig()
        const url = serverUrl ?? config.server
        const result = await login(url, user, password)
        saveConfigValue('token', result.token)
        return jsonResult({
          message: `Logged in as ${result.user.firstName} ${result.user.lastName} (${result.user.email})`,
          tokenStored: true,
        })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_config',
    {
      title: 'Get Configuration',
      description: 'Show current sk-cli configuration: server URL, default board, and whether a token is set.',
    },
    async () => {
      try {
        const config = resolveConfig()
        return jsonResult({
          server: config.server,
          defaultBoardId: config.defaultBoardId ?? null,
          hasToken: !!config.token,
          format: config.format,
        })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_boards',
    {
      title: 'List Boards',
      description: 'List all SwiftKanban boards accessible to the authenticated user.',
    },
    async () => {
      try {
        const { client } = makeClient()
        const boards = await listBoards(client)
        return jsonResult(boards)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_board',
    {
      title: 'Get Board Details',
      description: 'Get details of a specific SwiftKanban board.',
      inputSchema: z.object({
        board_id: z.string().describe('Board ID'),
      }),
    },
    async ({ board_id }) => {
      try {
        const { client } = makeClient()
        const board = await getBoard(client, board_id)
        return jsonResult(board)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_cards',
    {
      title: 'List Cards',
      description: 'List cards on a SwiftKanban board. If board_id is omitted, uses the default board (SK_BOARD_ID).',
      inputSchema: z.object({
        board_id: z.string().optional().describe('Board ID (optional if default is set)'),
        filter: z.string().optional().describe('Filter expression'),
        limit: z.string().optional().describe('Limit number of results'),
        offset: z.string().optional().describe('Offset for pagination'),
      }),
    },
    async ({ board_id, filter, limit, offset }) => {
      try {
        const { client, config } = makeClient()
        const boardId = requireBoardId(board_id, config.defaultBoardId)
        const cards = await listCards(client, { boardId, filter, limit, offset })
        return jsonResult(cards)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_card',
    {
      title: 'Get Card Details',
      description: 'Get details of a specific card. card_id must be in CardCode:numericId format (e.g., "UserStory:679602").',
      inputSchema: z.object({
        board_id: z.string().optional().describe('Board ID (optional if default is set)'),
        card_id: z.string().describe('Card ID in CardCode:numericId format (e.g., "UserStory:679602")'),
      }),
    },
    async ({ board_id, card_id }) => {
      try {
        const { client, config } = makeClient()
        const boardId = requireBoardId(board_id, config.defaultBoardId)
        const card = await getCard(client, boardId, card_id)
        return jsonResult(card)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'create_card',
    {
      title: 'Create Card',
      description: 'Create a new card on a SwiftKanban board.',
      inputSchema: z.object({
        board_id: z.string().optional().describe('Board ID (optional if default is set)'),
        name: z.string().describe('Card name/title'),
        description: z.string().optional().describe('Card description'),
      }),
    },
    async ({ board_id, name, description }) => {
      try {
        const { client, config } = makeClient()
        const boardId = requireBoardId(board_id, config.defaultBoardId)
        const card = await createCard(client, boardId, { name, ...(description && { description }) })
        return jsonResult(card)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'update_card',
    {
      title: 'Update Card',
      description: 'Update an existing card. card_id must be in CardCode:numericId format (e.g., "UserStory:679602").',
      inputSchema: z.object({
        board_id: z.string().optional().describe('Board ID (optional if default is set)'),
        card_id: z.string().describe('Card ID in CardCode:numericId format'),
        name: z.string().optional().describe('New card name'),
        description: z.string().optional().describe('New card description'),
      }),
    },
    async ({ board_id, card_id, name, description }) => {
      try {
        const { client, config } = makeClient()
        const boardId = requireBoardId(board_id, config.defaultBoardId)
        const input = {
          ...(name && { name }),
          ...(description && { description }),
        }
        const card = await updateCard(client, boardId, card_id, input)
        return jsonResult(card)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'delete_card',
    {
      title: 'Delete Card',
      description: 'Delete a card from a SwiftKanban board. card_id must be in CardCode:numericId format (e.g., "UserStory:679602").',
      inputSchema: z.object({
        board_id: z.string().optional().describe('Board ID (optional if default is set)'),
        card_id: z.string().describe('Card ID in CardCode:numericId format'),
      }),
    },
    async ({ board_id, card_id }) => {
      try {
        const { client, config } = makeClient()
        const boardId = requireBoardId(board_id, config.defaultBoardId)
        await deleteCard(client, boardId, card_id)
        return jsonResult({ deleted: card_id })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  return server
}

async function main() {
  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('sk-swiftkanban MCP server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
