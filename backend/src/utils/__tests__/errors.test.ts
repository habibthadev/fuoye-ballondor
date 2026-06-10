import { describe, it, expect } from 'vitest'
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, RateLimitError } from '../errors.js'

describe('AppError', () => {
  it('creates error with message, statusCode, and code', () => {
    const err = new AppError('Something went wrong', 400, 'BAD_REQUEST')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Something went wrong')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('BAD_REQUEST')
    expect(err.name).toBe('AppError')
  })
})

describe('NotFoundError', () => {
  it('creates 404 error with resource name', () => {
    const err = new NotFoundError('Category')
    expect(err.message).toBe('Category not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.name).toBe('NotFoundError')
  })
})

describe('UnauthorizedError', () => {
  it('creates 401 error with default message', () => {
    const err = new UnauthorizedError()
    expect(err.message).toBe('Unauthorized')
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.name).toBe('UnauthorizedError')
  })

  it('creates 401 error with custom message', () => {
    const err = new UnauthorizedError('Token expired')
    expect(err.message).toBe('Token expired')
    expect(err.statusCode).toBe(401)
  })
})

describe('ForbiddenError', () => {
  it('creates 403 error', () => {
    const err = new ForbiddenError()
    expect(err.message).toBe('Forbidden')
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
    expect(err.name).toBe('ForbiddenError')
  })
})

describe('ValidationError', () => {
  it('creates 400 error with issues', () => {
    const issues = { name: ['Required'], email: ['Invalid email'] }
    const err = new ValidationError(issues)
    expect(err.message).toBe('Validation failed')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.issues).toEqual(issues)
  })
})

describe('ConflictError', () => {
  it('creates 409 error', () => {
    const err = new ConflictError('Email already exists')
    expect(err.message).toBe('Email already exists')
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe('CONFLICT')
  })
})

describe('RateLimitError', () => {
  it('creates 429 error with default message', () => {
    const err = new RateLimitError()
    expect(err.message).toBe('Too many requests')
    expect(err.statusCode).toBe(429)
    expect(err.code).toBe('RATE_LIMIT')
  })

  it('creates 429 error with custom message', () => {
    const err = new RateLimitError('Slow down')
    expect(err.message).toBe('Slow down')
  })
})
