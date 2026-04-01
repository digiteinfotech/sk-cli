import { ApiError } from '../api/types.js'

interface AuthResponse {
  Response: {
    details: {
      userData?: {
        firstName: string
        lastName: string
        loginId: string
        emailId: string
        personId: number
      }
      authDetails?: {
        AuthorizationToken: string
      }
    }
    messageView: {
      type: string
      message: string[]
    }
  }
}

export interface LoginResult {
  token: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export async function login(server: string, user: string, password: string): Promise<LoginResult> {
  const baseUrl = server.replace(/\/+$/, '')
  const url = `${baseUrl}/restapi/secured/auth`
  const b64 = Buffer.from(`${user}:${password}`).toString('base64')
  const body = JSON.stringify({ AuthenticationToken: `SwiftKanban ${b64}` })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json',
      },
      body,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'Login request timed out')
    }
    throw new ApiError('NETWORK_ERROR', `Cannot connect to ${baseUrl}`)
  } finally {
    clearTimeout(timeout)
  }

  const data = await response.json() as AuthResponse
  const messageView = data.Response?.messageView

  if (!response.ok || messageView?.type === 'error') {
    const message = messageView?.message?.[0] ?? `Login failed with status ${response.status}`
    throw new ApiError('AUTH_FAILED', message, response.status)
  }

  const authDetails = data.Response?.details?.authDetails
  const userData = data.Response?.details?.userData

  if (!authDetails?.AuthorizationToken) {
    throw new ApiError('AUTH_FAILED', 'No token in response')
  }

  return {
    token: authDetails.AuthorizationToken,
    user: {
      firstName: userData?.firstName ?? '',
      lastName: userData?.lastName ?? '',
      email: userData?.emailId ?? user,
    },
  }
}
