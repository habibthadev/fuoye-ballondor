import { describe, it, expect } from 'vitest'
import { hashToken } from '../crypto.js'

describe('hashToken', () => {
  it('returns a 64-character hex string', () => {
    const result = hashToken('some-random-token-value')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic for the same input', () => {
    const input = 'test-token-123'
    expect(hashToken(input)).toBe(hashToken(input))
  })

  it('produces different hashes for different inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
  })

  it('handles empty string', () => {
    const result = hashToken('')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('handles long input', () => {
    const long = 'a'.repeat(1000)
    const result = hashToken(long)
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('handles special characters', () => {
    const result = hashToken('hello!@#$%^&*()_+{}:">?<')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })
})
