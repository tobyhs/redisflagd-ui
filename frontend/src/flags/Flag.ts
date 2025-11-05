type VariantsMap =
  | Record<string, boolean>
  | Record<string, string>
  | Record<string, number>
  | Record<string, object>

/**
 * A feature flag's configuration
 */
export interface Flag {
  /** key/identifier for the feature flag */
  key: string

  /**
   * this feature flag's configuration
   *
   * See https://github.com/open-feature/flagd-schemas/blob/main/json/flags.json
   */
  configuration: {
    state: 'ENABLED' | 'DISABLED'
    variants: VariantsMap
    defaultVariant: string | null
    targeting?: object
  }
}
