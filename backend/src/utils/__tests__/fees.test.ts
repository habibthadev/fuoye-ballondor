import { describe, it, expect } from 'vitest'
import { calculateFees } from '../fees.js'

describe('calculateFees', () => {
  it('calculates fees for a small amount', () => {
    const result = calculateFees(100)
    expect(result.fee).toBe(2)
    expect(result.vatOnFee).toBe(0)
    expect(result.totalCharged).toBe(102)
  })

  it('calculates fees for a medium amount', () => {
    const result = calculateFees(10000)
    expect(result.fee).toBe(200)
    expect(result.vatOnFee).toBe(15)
    expect(result.totalCharged).toBe(10215)
  })

  it('caps fee at 2000', () => {
    const result = calculateFees(200000)
    expect(result.fee).toBe(2000)
    expect(result.vatOnFee).toBe(150)
    expect(result.totalCharged).toBe(202150)
  })

  it('handles zero base amount', () => {
    const result = calculateFees(0)
    expect(result.fee).toBe(0)
    expect(result.vatOnFee).toBe(0)
    expect(result.totalCharged).toBe(0)
  })

  it('handles single naira amount', () => {
    const result = calculateFees(1)
    expect(result.fee).toBe(0)
    expect(result.vatOnFee).toBe(0)
    expect(result.totalCharged).toBe(1)
  })

  it('rounds fee down', () => {
    const result = calculateFees(101)
    expect(result.fee).toBe(2)
    expect(result.totalCharged).toBe(103)
  })

  it('rounds vat correctly', () => {
    const result = calculateFees(151)
    expect(result.fee).toBe(3)
    expect(result.vatOnFee).toBe(0)
    expect(result.totalCharged).toBe(154)
  })

  it('caps fee and calculates vat on capped fee', () => {
    const result = calculateFees(150000)
    expect(result.fee).toBe(2000)
    expect(result.vatOnFee).toBe(150)
    expect(result.totalCharged).toBe(152150)
  })

  it('produces correct total for typical vote of 500 naira', () => {
    const result = calculateFees(500)
    expect(result.fee).toBe(10)
    expect(result.vatOnFee).toBe(1)
    expect(result.totalCharged).toBe(511)
  })
})
