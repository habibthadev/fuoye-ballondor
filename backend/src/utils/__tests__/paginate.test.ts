import { describe, it, expect } from 'vitest'
import { parsePagination, paginatedResult } from '../paginate.js'

describe('parsePagination', () => {
  it('returns defaults when no query provided', () => {
    const result = parsePagination({})
    expect(result).toEqual({ page: 1, limit: 20 })
  })

  it('parses page and limit from query', () => {
    const result = parsePagination({ page: '3', limit: '10' })
    expect(result).toEqual({ page: 3, limit: 10 })
  })

  it('clamps limit to max 100', () => {
    const result = parsePagination({ limit: '200' })
    expect(result.limit).toBe(100)
  })

  it('treats limit=0 as default 20 due to || fallback', () => {
    const result = parsePagination({ limit: '0' })
    expect(result.limit).toBe(20)
  })

  it('clamps limit to min 1 when negative', () => {
    const result = parsePagination({ limit: '-5' })
    expect(result.limit).toBe(1)
  })

  it('clamps page to min 1', () => {
    const result = parsePagination({ page: '0' })
    expect(result.page).toBe(1)
  })

  it('handles negative numbers', () => {
    const result = parsePagination({ page: '-5', limit: '-10' })
    expect(result.page).toBe(1)
    expect(result.limit).toBe(1)
  })

  it('handles non-numeric strings', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' })
    expect(result).toEqual({ page: 1, limit: 20 })
  })

  it('handles decimal numbers', () => {
    const result = parsePagination({ page: '2.7', limit: '15.3' })
    expect(result).toEqual({ page: 2, limit: 15 })
  })

  it('handles undefined values', () => {
    const result = parsePagination({ page: undefined, limit: undefined })
    expect(result).toEqual({ page: 1, limit: 20 })
  })
})

describe('paginatedResult', () => {
  const data = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('wraps data with pagination metadata', () => {
    const result = paginatedResult(data, 30, { page: 2, limit: 10 })
    expect(result.data).toEqual(data)
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 30,
      totalPages: 3,
    })
  })

  it('handles empty data', () => {
    const result = paginatedResult([], 0, { page: 1, limit: 20 })
    expect(result.data).toEqual([])
    expect(result.pagination.totalPages).toBe(0)
  })

  it('handles last page with fewer items', () => {
    const result = paginatedResult(data, 23, { page: 3, limit: 10 })
    expect(result.pagination.totalPages).toBe(3)
    expect(result.data.length).toBe(3)
  })

  it('handles single item total', () => {
    const result = paginatedResult([{ id: 1 }], 1, { page: 1, limit: 20 })
    expect(result.pagination.totalPages).toBe(1)
  })

  it('rounds totalPages up', () => {
    const result = paginatedResult(data, 25, { page: 1, limit: 10 })
    expect(result.pagination.totalPages).toBe(3)
  })
})
