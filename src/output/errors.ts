import { ApiError } from '../api/types.js'
import { failure, outputJson } from './formatter.js'

function exit(code: number): never {
  return process.exit(code) as never
}

export function handleError(error: unknown): never {
  if (error instanceof ApiError) {
    outputJson(failure(error.code, error.message, error.status))

    if (error.status && error.status >= 500) {
      exit(2)
    }
    exit(1)
  }

  if (error instanceof Error) {
    if (error.message.includes('CONFIG')) {
      outputJson(failure('CONFIG_ERROR', error.message))
      exit(3)
    }
    outputJson(failure('UNKNOWN_ERROR', error.message))
    exit(1)
  }

  outputJson(failure('UNKNOWN_ERROR', String(error)))
  exit(1)
}
