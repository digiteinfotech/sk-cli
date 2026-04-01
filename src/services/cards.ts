import { RestClient } from '../api/client.js'
import {
  ApiError,
  type Card,
  type CreateCardInput,
  type SkResponse,
  type UpdateCardInput,
  cardListSchema,
  cardSchema,
  skResponseSchema,
} from '../api/types.js'

export interface ListCardsOptions {
  boardId: string
  filter?: string
  limit?: string
  offset?: string
}

export async function listCards(client: RestClient, options: ListCardsOptions): Promise<Card[]> {
  const raw = await client.get<SkResponse>(`/restapi/card-operations/boards/${options.boardId}/cards`, {
    filter: options.filter,
    limit: options.limit,
    offset: options.offset,
  })
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('API_ERROR', parsed.Response.messageView.message?.[0] ?? 'Failed to list cards')
  }
  const cards = parsed.Response.details.cardDetails
  if (!cards) return []
  return cardListSchema.parse(Array.isArray(cards) ? cards : [cards])
}

export async function getCard(client: RestClient, boardId: string, cardId: string): Promise<Card> {
  // cardId can be "CardCode:numericId" (e.g. "PERS:1859339") or just the combined form
  const raw = await client.get<SkResponse>(`/restapi/card-operations/boards/${boardId}/cards/${cardId}`)
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('NOT_FOUND', parsed.Response.messageView.message?.[0] ?? `Card ${cardId} not found`)
  }
  const details = parsed.Response.details.cardDetails
  if (!details) {
    throw new ApiError('NOT_FOUND', `Card ${cardId} not found`)
  }
  return cardSchema.parse(Array.isArray(details) ? details[0] : details)
}

export async function createCard(client: RestClient, boardId: string, input: CreateCardInput): Promise<Card> {
  const raw = await client.post<SkResponse>(`/restapi/card-operations/boards/${boardId}/cards`, input)
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('API_ERROR', parsed.Response.messageView.message?.[0] ?? 'Failed to create card')
  }
  const details = parsed.Response.details.cardDetails
  if (!details) {
    throw new ApiError('API_ERROR', 'No card data in response')
  }
  return cardSchema.parse(Array.isArray(details) ? details[0] : details)
}

export async function updateCard(client: RestClient, boardId: string, cardId: string, input: UpdateCardInput): Promise<Card> {
  const raw = await client.put<SkResponse>(`/restapi/card-operations/boards/${boardId}/cards`, { ...input, id: cardId })
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('API_ERROR', parsed.Response.messageView.message?.[0] ?? 'Failed to update card')
  }
  const details = parsed.Response.details.cardDetails
  if (!details) {
    throw new ApiError('API_ERROR', 'No card data in response')
  }
  return cardSchema.parse(Array.isArray(details) ? details[0] : details)
}

export async function deleteCard(client: RestClient, boardId: string, cardId: string): Promise<void> {
  const raw = await client.delete<SkResponse>(`/restapi/card-operations/boards/${boardId}/cards/${cardId}`)
  const parsed = skResponseSchema.parse(raw)
  if (parsed.Response.messageView.type === 'error') {
    throw new ApiError('API_ERROR', parsed.Response.messageView.message?.[0] ?? 'Failed to delete card')
  }
}
