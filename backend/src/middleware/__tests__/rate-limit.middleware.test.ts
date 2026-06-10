import { describe, it, expect } from 'vitest'
import { rateLimit, voteInitiateLimit, loginLimit, generalPublicLimit } from '../rate-limit.middleware.js'

describe('rateLimit factory', () => {
  it('returns a middleware function', () => {
    const mw = rateLimit({ windowMs: 60_000, max: 10 })
    expect(typeof mw).toBe('function')
  })
})

describe('rate limit configs', () => {
  it('voteInitiateLimit exists and is a function', () => {
    expect(typeof voteInitiateLimit).toBe('function')
  })

  it('loginLimit exists and is a function', () => {
    expect(typeof loginLimit).toBe('function')
  })

  it('generalPublicLimit exists and is a function', () => {
    expect(typeof generalPublicLimit).toBe('function')
  })
})
