export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1)
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 20))
  return { page, limit }
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  }
}
