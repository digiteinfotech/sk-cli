import { z } from 'zod'

// --- Error types ---

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public detail?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// --- SwiftKanban response envelope ---

export const skResponseSchema = z.object({
  Response: z.object({
    details: z.record(z.string(), z.unknown()),
    messageView: z.object({
      type: z.string(),
      message: z.array(z.string()).optional(),
    }),
  }),
})

export type SkResponse = z.infer<typeof skResponseSchema>

// --- Board types ---

export const boardSchema = z.object({
  boardId: z.string(),
  projectName: z.string(),
  currentState: z.string().optional(),
  ownerOrg: z.string().optional(),
  createdDate: z.string().optional(),
  modifiedDate: z.string().optional(),
}).passthrough()

export type Board = z.infer<typeof boardSchema>

export const boardListSchema = z.array(boardSchema)

// --- Card types ---

export const cardSchema = z.object({
  id: z.string(),
  name: z.string(),
  cardNumber: z.string().optional(),
  workType: z.string().optional(),
  description: z.string().optional(),
  currentQueue: z.string().optional(),
  currentQueueId: z.string().optional(),
  currentSwimName: z.string().optional(),
  currentSwimId: z.string().optional(),
  currentOwner: z.string().optional(),
  currentState: z.string().optional(),
  priority: z.string().optional(),
  cardSize: z.string().optional(),
  createdDate: z.string().optional(),
  modifiedDate: z.string().optional(),
}).passthrough()

export type Card = z.infer<typeof cardSchema>

export const cardListSchema = z.array(cardSchema)

export interface CreateCardInput {
  name: string
  description?: string
  [key: string]: unknown
}

export interface UpdateCardInput {
  name?: string
  description?: string
  [key: string]: unknown
}
