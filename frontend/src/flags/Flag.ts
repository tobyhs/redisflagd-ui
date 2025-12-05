type VariantsMap = Record<string, boolean>
  | Record<string, string>
  | Record<string, number>
  | Record<string, object>

/**
 * A feature flag's configuration
 *
 * See See https://github.com/open-feature/flagd-schemas/blob/main/json/flags.json
 */
export interface Flag {
  /** key/identifier for the feature flag */
  key: string

  /** indicates whether the flag is functional */
  state: 'ENABLED' | 'DISABLED'

  /** object containing the possible variations */
  variants: VariantsMap

  /** the variant to serve if no dynamic targeting applies */
  defaultVariant: string | null

  /** targeting rules/logic */
  targeting?: object

  /** key/value pairs of metadata */
  metadata?: Record<string, string | number | boolean>
}
