import { RestClient } from '../api/client.js'
import {
  type Card,
  type CreateCardInput,
  type UpdateCardInput,
  cardListSchema,
  cardSchema,
} from '../api/types.js'

export interface ListCardsOptions {
  boardId: string
  filter?: string
  limit?: string
  offset?: string
}

export async function listCards(client: RestClient, options: ListCardsOptions): Promise<Card[]> {
  const data = await client.get('/api/boardcards', {
    boardId: options.boardId,
    filter: options.filter,
    limit: options.limit,
    offset: options.offset,
  })
  return cardListSchema.parse(data)
}

export async function getCard(client: RestClient, cardId: string, boardId?: string): Promise<Card> {
  const data = await client.get(`/api/boardcards/${cardId}`, {
    boardId,
  })
  return cardSchema.parse(data)
}

export async function createCard(client: RestClient, input: CreateCardInput & { boardId: string }): Promise<Card> {
  const { boardId, ...body } = input
  const data = await client.post('/api/boardcards', { ...body, boardId })
  return cardSchema.parse(data)
}

export async function updateCard(client: RestClient, cardId: string, input: UpdateCardInput): Promise<Card> {
  const data = await client.put(`/api/boardcards/${cardId}`, input)
  return cardSchema.parse(data)
}

export async function deleteCard(client: RestClient, cardId: string): Promise<void> {
  await client.delete(`/api/boardcards/${cardId}`)
}
