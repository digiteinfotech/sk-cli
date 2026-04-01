import { RestClient } from '../api/client.js'
import { type Board, boardListSchema, boardSchema } from '../api/types.js'

export async function listBoards(client: RestClient): Promise<Board[]> {
  const data = await client.get('/api/boards')
  return boardListSchema.parse(data)
}

export async function getBoard(client: RestClient, boardId: string): Promise<Board> {
  const data = await client.get(`/api/boards/${boardId}`)
  return boardSchema.parse(data)
}
