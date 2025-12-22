/**
 * A validation error for a field
 */
interface FieldValidationError {
  /** the error message */
  message: string
}

/**
 * Parsed response body for a server-side validation error when creating/updating a resource
 *
 * @typeParam T - type of resource the errors are for
 */
export interface ValidationErrorBody<T> {
  /** mapping of a field to its validation errors */
  errors: {
    [field in keyof T]?: FieldValidationError[]
  }
}
