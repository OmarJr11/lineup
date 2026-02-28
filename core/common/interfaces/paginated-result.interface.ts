/**
 * Generic paginated result structure.
 * Used for endpoints that return paginated lists of items.
 */
export interface IPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
