import { describe, it, expect } from 'vitest'
import { authMiddleware, superadminMiddleware } from '../auth.middleware.js'

describe('authMiddleware', () => {
  it('exists and is a function', () => {
    expect(typeof authMiddleware).toBe('function')
  })
})

describe('superadminMiddleware', () => {
  it('exists and is a function', () => {
    expect(typeof superadminMiddleware).toBe('function')
  })
})
