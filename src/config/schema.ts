import { z } from 'zod'

export const configSchema = z.object({
  server: z.string().url().default('https://webapi.swiftkanban.com'),
  token: z.string().optional(),
  defaultBoardId: z.string().optional(),
  format: z.enum(['json', 'table']).default('json'),
  user: z.string().optional(),
  password: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

export const configKeys = configSchema.keyof().options
