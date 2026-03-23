/**
 * Response body for a page of data from an API to list resources
 */
export interface ApiPage<T> {
  /** list of resources */
  data: T[]

  /** value for fetching the next page, or null if this is the last page */
  nextCursor: string | null
}
