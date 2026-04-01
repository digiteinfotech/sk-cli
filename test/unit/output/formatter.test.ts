import { describe, it, expect } from 'vitest'
import { success, failure } from '../../../src/output/formatter.js'

describe('success', () => {
  it('creates a success result', () => {
    const result = success({ id: '1', name: 'Test' })
    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ id: '1', name: 'Test' })
  })

  it('includes meta when provided', () => {
    const result = success([1, 2, 3], { total: 3 })
    expect(result.ok).toBe(true)
    expect(result.meta).toEqual({ total: 3 })
  })

  it('omits meta when not provided', () => {
    const result = success('data')
    expect(result).not.toHaveProperty('meta')
  })
})

describe('failure', () => {
  it('creates an error result', () => {
    const result = failure('NOT_FOUND', 'Card not found', 404)
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('NOT_FOUND')
    expect(result.error.message).toBe('Card not found')
    expect(result.error.status).toBe(404)
  })

  it('omits status when not provided', () => {
    const result = failure('UNKNOWN', 'Something went wrong')
    expect(result.error).not.toHaveProperty('status')
  })
})
