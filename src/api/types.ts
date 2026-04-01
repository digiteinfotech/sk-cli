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

// --- Board types ---

export const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
}).passthrough()

export type Board = z.infer<typeof boardSchema>

export const boardListSchema = z.array(boardSchema)

// --- Card types ---

export const cardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  columnId: z.string().optional(),
  swimlaneId: z.string().optional(),
  assignedTo: z.string().optional(),
}).passthrough()

export type Card = z.infer<typeof cardSchema>

export const cardListSchema = z.array(cardSchema)

export interface CreateCardInput {
  title: string
  description?: string
  swimlaneId?: string
  columnId?: string
  [key: string]: unknown
}

export interface UpdateCardInput {
  title?: string
  description?: string
  [key: string]: unknown
}
