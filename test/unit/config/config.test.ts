import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Test the config schema independently
import { configSchema } from '../../../src/config/schema.js'

describe('configSchema', () => {
  it('parses with defaults when given empty object', () => {
    const result = configSchema.parse({})
    expect(result.server).toBe('https://webapi.swiftkanban.com')
    expect(result.format).toBe('json')
    expect(result.token).toBeUndefined()
  })

  it('parses a full config', () => {
    const result = configSchema.parse({
      server: 'https://custom.example.com',
      token: 'my-token',
      defaultBoardId: 'BOARD-1',
      format: 'table',
    })
    expect(result.server).toBe('https://custom.example.com')
    expect(result.token).toBe('my-token')
    expect(result.defaultBoardId).toBe('BOARD-1')
    expect(result.format).toBe('table')
  })

  it('rejects invalid server URL', () => {
    expect(() => configSchema.parse({ server: 'not-a-url' })).toThrow()
  })

  it('rejects invalid format', () => {
    expect(() => configSchema.parse({ format: 'xml' })).toThrow()
  })
})
