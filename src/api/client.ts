import { type Config } from '../config/schema.js'
import { ApiError } from './types.js'

interface RequestOptions {
  method?: string
  path: string
  body?: unknown
  query?: Record<string, string | undefined>
}

const MAX_RETRIES = 3
const TIMEOUT_MS = 30_000

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value)
      }
    }
  }
  return url.toString()
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RestClient {
  private baseUrl: string
  private token: string | undefined

  constructor(config: Config) {
    this.baseUrl = config.server.replace(/\/+$/, '')
    this.token = config.token
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method = 'GET', path, body, query } = options
    const url = buildUrl(this.baseUrl, path, query)
    const headers = this.getHeaders()

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.ok) {
          const data = await response.json()
          return data as T
        }

        if (response.status === 401) {
          throw new ApiError('AUTH_FAILED', 'Authentication failed — check your token', 401)
        }

        if (response.status === 404) {
          throw new ApiError('NOT_FOUND', `Resource not found: ${path}`, 404)
        }

        if (response.status === 429 || response.status >= 500) {
          lastError = new ApiError(
            response.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR',
            `Server returned ${response.status}`,
            response.status,
          )
          const delay = Math.pow(2, attempt) * 1000
          await sleep(delay)
          continue
        }

        const errorBody = await response.text().catch(() => '')
        throw new ApiError(
          'API_ERROR',
          `API returned ${response.status}: ${errorBody || response.statusText}`,
          response.status,
          errorBody,
        )
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === 'RATE_LIMITED' || error.code === 'SERVER_ERROR') {
            lastError = error
            continue
          }
          throw error
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ApiError('TIMEOUT', `Request timed out after ${TIMEOUT_MS}ms`, undefined)
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new ApiError('NETWORK_ERROR', `Cannot connect to ${this.baseUrl}`, undefined)
        }

        throw error
      }
    }

    throw lastError ?? new ApiError('SERVER_ERROR', 'Request failed after retries')
  }

  async get<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query })
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body })
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path })
  }
}
