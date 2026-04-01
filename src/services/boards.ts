import { RestClient } from '../api/client.js'
import { ApiError, type Board, type SkResponse, boardListSchema, boardSchema, skResponseSchema } from '../api/types.js'

export async function listBoards(client: RestClient): Promise<Board[]> {
  const raw = await client.get<SkResponse>('/restapi/board-operations/boards')
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('API_ERROR', parsed.Response.messageView.message?.[0] ?? 'Failed to list boards')
  }
  const boards = parsed.Response.details.board
  if (!boards) return []
  return boardListSchema.parse(Array.isArray(boards) ? boards : [boards])
}

export async function getBoard(client: RestClient, boardId: string): Promise<Board> {
  const raw = await client.get<SkResponse>(`/restapi/board-operations/boards/${boardId}`)
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('NOT_FOUND', parsed.Response.messageView.message?.[0] ?? `Board ${boardId} not found`)
  }
  const details = parsed.Response.details.boardDetails
  if (!details) {
    throw new ApiError('NOT_FOUND', `Board ${boardId} not found`)
  }
  return boardSchema.parse(details)
}
