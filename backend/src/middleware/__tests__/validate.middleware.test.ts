import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { validate } from '../validate.middleware.js'

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
  })

  it('returns a middleware function', () => {
    const handler = validate(schema)
    expect(typeof handler).toBe('function')
  })

  it('can be called with different targets', () => {
    expect(typeof validate(schema, 'json')).toBe('function')
    expect(typeof validate(schema, 'query')).toBe('function')
    expect(typeof validate(schema, 'param')).toBe('function')
  })
})
