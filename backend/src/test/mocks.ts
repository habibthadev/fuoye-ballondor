import { vi } from 'vitest'

export function mockModel(model: Record<string, unknown>, methods: Record<string, unknown> = {}) {
  const mocked: Record<string, unknown> = {}
  for (const [key] of Object.entries(model)) {
    mocked[key] = vi.fn()
  }
  for (const [key, val] of Object.entries(methods)) {
    mocked[key] = val
  }
  return mocked as any
}

export function mockFindById(returns: unknown) {
  return { lean: vi.fn().mockResolvedValue(returns) } as any
}

export function mockFindByIdAndUpdate(returns: unknown) {
  return { lean: vi.fn().mockResolvedValue(returns) } as any
}

export function mockFindOne(returns: unknown) {
  return { lean: vi.fn().mockResolvedValue(returns) } as any
}

export function mockFind(returns: unknown[]) {
  const query = {
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(returns),
  }
  return query
}

export function createMockApp(override?: Record<string, unknown>) {
  return {
    fetch: vi.fn().mockResolvedValue(new Response()),
    request: vi.fn().mockResolvedValue(new Response()),
    ...override,
  }
}
