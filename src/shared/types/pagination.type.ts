export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: Pagination
}
