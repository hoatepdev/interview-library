/**
 * Generic paginated response wrapper
 * Used for list endpoints that return pagination metadata
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
