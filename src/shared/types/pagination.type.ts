export type PaginationQuery = {
  page: number
  pageSize: number
}

export type PaginationResponse = PaginationQuery & {
  total: number
  totalPages: number
}

export type PaginatedQuery<T> = {
  filter?: Partial<T>
  pagination: PaginationQuery
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: PaginationResponse
}
